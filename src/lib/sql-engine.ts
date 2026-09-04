import type { JsonPrimitive, JsonRow, PracticeDataset } from "@/db/schema";

export type SqlExecution = {
  ok: boolean;
  message: string;
  rows: JsonRow[];
  columns: string[];
};

const FORBIDDEN = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|execute|call|merge|replace|vacuum|analyze)\b/i;

function parseLiteral(value: string): JsonPrimitive {
  const trimmed = value.trim();
  if (/^'.*'$/.test(trimmed) || /^".*"$/.test(trimmed)) return trimmed.slice(1, -1);
  if (/^null$/i.test(trimmed)) return null;
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === "true";
  const numberValue = Number(trimmed);
  return Number.isFinite(numberValue) ? numberValue : trimmed;
}

function compare(left: JsonPrimitive, operator: string, right: JsonPrimitive) {
  if (operator === "=") return String(left) === String(right);
  if (operator === "!=" || operator === "<>") return String(left) !== String(right);
  if (typeof left === "number" && typeof right === "number") {
    if (operator === ">") return left > right;
    if (operator === ">=") return left >= right;
    if (operator === "<") return left < right;
    if (operator === "<=") return left <= right;
  }
  if (operator.toLowerCase() === "like") {
    const escaped = String(right).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*");
    return new RegExp(`^${escaped}$`, "i").test(String(left));
  }
  return false;
}

function applyWhere(rows: JsonRow[], whereClause?: string) {
  if (!whereClause) return rows;
  const conditions = whereClause.split(/\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
  return rows.filter((row) =>
    conditions.every((condition) => {
      const match = condition.match(/^([a-zA-Z_][\w]*)\s*(=|!=|<>|>=|<=|>|<|like)\s*(.+)$/i);
      if (!match) throw new Error(`Unsupported WHERE condition: ${condition}`);
      const [, column, operator, rawValue] = match;
      return compare(row[column], operator, parseLiteral(rawValue));
    }),
  );
}

function applyOrder(rows: JsonRow[], orderClause?: string) {
  if (!orderClause) return rows;
  const match = orderClause.trim().match(/^([a-zA-Z_][\w]*)(?:\s+(asc|desc))?$/i);
  if (!match) throw new Error("Only single-column ORDER BY is supported in this practice sandbox.");
  const [, column, direction = "asc"] = match;
  return [...rows].sort((a, b) => {
    const left = a[column];
    const right = b[column];
    if (left === right) return 0;
    const result = String(left) > String(right) ? 1 : -1;
    return direction.toLowerCase() === "desc" ? -result : result;
  });
}

function projectRows(rows: JsonRow[], selectClause: string) {
  const trimmed = selectClause.trim();
  if (trimmed === "*") {
    const columns = Object.keys(rows[0] ?? {});
    return { rows, columns };
  }
  const columns = trimmed.split(",").map((column) => column.trim()).filter(Boolean);
  if (!columns.length || columns.some((column) => !/^[a-zA-Z_][\w]*$/.test(column))) {
    throw new Error("Only simple column projections are supported.");
  }
  return {
    columns,
    rows: rows.map((row) =>
      columns.reduce<JsonRow>((next, column) => {
        next[column] = row[column] ?? null;
        return next;
      }, {}),
    ),
  };
}

export function normalizeRows(rows: JsonRow[]) {
  return rows.map((row) => {
    const sorted: JsonRow = {};
    for (const key of Object.keys(row).sort()) sorted[key] = row[key];
    return sorted;
  });
}

export function areRowsEqual(left: JsonRow[], right: JsonRow[]) {
  return JSON.stringify(normalizeRows(left)) === JSON.stringify(normalizeRows(right));
}

export function executePracticeSql(sql: string, dataset: PracticeDataset): SqlExecution {
  const query = sql.trim();
  if (!query) return { ok: false, message: "Write a SELECT query first.", rows: [], columns: [] };
  if (FORBIDDEN.test(query) || query.split(";").filter((part) => part.trim()).length > 1) {
    return { ok: false, message: "Only one safe SELECT statement is allowed in the practice sandbox.", rows: [], columns: [] };
  }

  try {
    const match = query.replace(/;$/, "").match(/^select\s+([\s\S]+?)\s+from\s+([a-zA-Z_][\w]*)(?:\s+where\s+([\s\S]+?))?(?:\s+order\s+by\s+([a-zA-Z_][\w]*(?:\s+(?:asc|desc))?))?$/i);
    if (!match) throw new Error("Use SELECT ... FROM table with optional WHERE and ORDER BY clauses.");
    const [, selectClause, tableName, whereClause, orderClause] = match;
    const table = dataset.tables[tableName];
    if (!table) throw new Error(`Table '${tableName}' is not available in this task.`);
    const filtered = applyWhere(table, whereClause);
    const ordered = applyOrder(filtered, orderClause);
    const projected = projectRows(ordered, selectClause);
    return {
      ok: true,
      message: `Query executed successfully. ${projected.rows.length} row${projected.rows.length === 1 ? "" : "s"} returned.`,
      rows: projected.rows,
      columns: projected.columns,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The practice query could not be executed.",
      rows: [],
      columns: [],
    };
  }
}

import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { DEFAULT_PRACTICE_DATASET } from "@/app/api/practice/run/route";
import { executePracticeSql, type SqlExecution } from "@/lib/sql-engine";
import type { PracticeDataset } from "@/db/schema";

export interface AgentActionPayload {
  type: "fill_query" | "run_query" | "none";
  sql?: string;
  table?: string;
  message?: string;
}

export interface AgentResponse {
  reply: string;
  suggestedSql?: string;
  suggestedTable?: string;
  action?: AgentActionPayload;
  execution?: SqlExecution;
  provider: "openai-agents-sdk" | "querynest-sql-engine";
}

// Tool 1: Schema & Metadata Inspection
const getSchemaTool = tool({
  name: "get_database_schema",
  description: "Inspect the schema and sample data of available practice database tables (employees, students, orders).",
  parameters: z.object({
    tableName: z.string().optional().describe("Optional specific table name to inspect"),
  }),
  execute: async ({ tableName }: { tableName?: string }) => {
    const dataset = DEFAULT_PRACTICE_DATASET;
    if (tableName && dataset.tables[tableName]) {
      const rows = dataset.tables[tableName];
      const columns = Object.keys(rows[0] ?? {});
      return JSON.stringify({
        table: tableName,
        columns,
        rowCount: rows.length,
        sampleRows: rows.slice(0, 3),
      });
    }
    const schemaSummary = Object.keys(dataset.tables).map((name) => {
      const rows = dataset.tables[name];
      return {
        table: name,
        columns: Object.keys(rows[0] ?? {}),
        rowCount: rows.length,
      };
    });
    return JSON.stringify({ tables: schemaSummary });
  },
});

// Tool 2: Safe SQL Sandbox Execution
const executeSqlTool = tool({
  name: "execute_sql_query",
  description: "Execute a safe SELECT query against the practice database to verify results and diagnose errors.",
  parameters: z.object({
    sql: z.string().describe("The SQL query to execute in the sandbox"),
  }),
  execute: async ({ sql }: { sql: string }) => {
    const result = executePracticeSql(sql, DEFAULT_PRACTICE_DATASET);
    return JSON.stringify({
      ok: result.ok,
      message: result.message,
      rowCount: result.rows.length,
      sampleRows: result.rows.slice(0, 5),
    });
  },
});

/**
 * Creates the OpenAI Agent instance adhering to the openai-agents-js architecture.
 */
function createSqlAgent() {
  return new Agent({
    name: "QueryNestSQLAgent",
    instructions: `You are the QueryNest SQL AI Tutor & Copilot.
Your job is to:
1. Help students learn SQL, write queries, fix query bugs, and understand relational concepts (SELECT, WHERE, JOIN, ORDER BY, GROUP BY, aggregates).
2. You have access to practice tables in the database:
   - "employees" (columns: id, name, department, salary, city)
   - "students" (columns: id, name, track, score, status)
   - "orders" (columns: id, customer, item, amount, status)
3. When a student asks how to write a query, or cannot write one:
   - Provide the complete, valid SQL query in a markdown \`\`\`sql code block.
   - Use the execute_sql_query tool to verify it works before answering.
   - Clearly explain each clause in beginner-friendly language.
   - Explicitly mention that they can click the "Fill Editor" or "Auto-Run" buttons to test it directly in the live SQL panel.
4. Keep answers pedagogical, friendly, clear, and focused on learning.`,
    tools: [getSchemaTool, executeSqlTool],
  });
}

/**
 * Heuristic/semantic SQL engine fallback for queries when OPENAI_API_KEY is not configured or in offline mode.
 */
function generateLocalSqlResponse(userInput: string, dataset: PracticeDataset = DEFAULT_PRACTICE_DATASET): AgentResponse {
  const text = userInput.toLowerCase().trim();

  // Determine relevant table
  let table = "employees";
  if (text.includes("student") || text.includes("score") || text.includes("track") || text.includes("pass")) {
    table = "students";
  } else if (text.includes("order") || text.includes("customer") || text.includes("amount") || text.includes("item")) {
    table = "orders";
  }

  let generatedSql = "";
  let explanation = "";

  // Common pattern recognition
  if (table === "employees") {
    if (text.includes("top") || text.includes("highest") || text.includes("max")) {
      generatedSql = "SELECT name, department, salary FROM employees ORDER BY salary desc";
      explanation = "This query selects employee names, departments, and salaries, sorted from highest to lowest using `ORDER BY salary DESC`.";
    } else if (text.includes("engineering") || text.includes("engineer")) {
      generatedSql = "SELECT name, salary, city FROM employees WHERE department = 'Engineering'";
      explanation = "This filters the employees table for rows where `department = 'Engineering'`.";
    } else if (text.includes("finance")) {
      generatedSql = "SELECT name, salary, city FROM employees WHERE department = 'Finance'";
      explanation = "This filters the employees table for rows where `department = 'Finance'`.";
    } else if (text.includes("bengaluru") || text.includes("bangalore")) {
      generatedSql = "SELECT name, department, salary FROM employees WHERE city = 'Bengaluru'";
      explanation = "This filters for all employees located in the city of Bengaluru.";
    } else if (text.includes("60") || text.includes("60000") || text.includes("60k")) {
      generatedSql = "SELECT name, department, salary FROM employees WHERE salary > 60000 ORDER BY salary desc";
      explanation = "This finds all employees earning more than 60,000 and orders them by highest salary first.";
    } else if (text.includes("70") || text.includes("70000") || text.includes("70k")) {
      generatedSql = "SELECT name, department, salary FROM employees WHERE salary > 70000 ORDER BY salary desc";
      explanation = "This filters employees with salaries strictly greater than 70,000.";
    } else if (text.includes("all") || text.includes("list") || text.includes("show") || text.includes("write") || text.includes("cant") || text.includes("help")) {
      generatedSql = "SELECT * FROM employees";
      explanation = "This selects all columns and all records from the employees table using `SELECT *`.";
    }
  } else if (table === "students") {
    if (text.includes("top") || text.includes("highest") || text.includes("best") || text.includes("score")) {
      generatedSql = "SELECT name, score, track FROM students WHERE score >= 80 ORDER BY score desc";
      explanation = "This filters students with scores 80 or above, ordering them by top performers first.";
    } else if (text.includes("sql")) {
      generatedSql = "SELECT name, score, status FROM students WHERE track = 'SQL'";
      explanation = "This lists all students enrolled in the 'SQL' learning track.";
    } else if (text.includes("need") || text.includes("practice")) {
      generatedSql = "SELECT name, track, score FROM students WHERE status = 'Needs Practice'";
      explanation = "This identifies students who need additional practice to pass.";
    } else {
      generatedSql = "SELECT * FROM students ORDER BY score desc";
      explanation = "This retrieves all student records sorted by their scores.";
    }
  } else if (table === "orders") {
    if (text.includes("completed")) {
      generatedSql = "SELECT customer, item, amount FROM orders WHERE status = 'Completed'";
      explanation = "This filters orders that have reached 'Completed' status.";
    } else if (text.includes("pending")) {
      generatedSql = "SELECT customer, item, amount FROM orders WHERE status = 'Pending'";
      explanation = "This finds all pending customer orders.";
    } else if (text.includes("1000") || text.includes("expensive") || text.includes("high")) {
      generatedSql = "SELECT customer, item, amount FROM orders WHERE amount >= 999 ORDER BY amount desc";
      explanation = "This finds high-value orders of 999 or more.";
    } else {
      generatedSql = "SELECT * FROM orders ORDER BY amount desc";
      explanation = "This shows all customer orders ordered from highest to lowest amount.";
    }
  }

  // If question is conceptual (e.g. "what is join", "how does where work")
  if (!generatedSql) {
    if (text.includes("join")) {
      return {
        reply: `**SQL JOIN Types Explained:**\n\n- **INNER JOIN**: Returns records that have matching values in both tables.\n- **LEFT JOIN**: Returns all records from the left table, and matched records from the right.\n- **RIGHT JOIN**: Returns all records from the right table, and matched records from the left.\n- **FULL OUTER JOIN**: Returns all records when there is a match in either table.\n\n*Example:*\n\`\`\`sql\nSELECT employees.name, departments.name \nFROM employees \nINNER JOIN departments ON employees.dept_id = departments.id;\n\`\`\``,
        provider: "querynest-sql-engine",
      };
    }
    if (text.includes("group by")) {
      return {
        reply: `**SQL GROUP BY Clause:**\n\n\`GROUP BY\` groups rows that have the same values into summary rows (like finding the average salary per department).\n\n*Example:*\n\`\`\`sql\nSELECT department, AVG(salary) AS avg_salary, COUNT(*) AS staff_count \nFROM employees \nGROUP BY department;\n\`\`\``,
        provider: "querynest-sql-engine",
      };
    }
    if (text.includes("where") || text.includes("filter")) {
      generatedSql = `SELECT name, salary, department FROM employees WHERE salary > 65000`;
      explanation = "The `WHERE` clause filters rows before any grouping or sorting occurs.";
    } else {
      generatedSql = `SELECT * FROM ${table}`;
      explanation = `Here is a starting query for the **${table}** dataset.`;
    }
  }

  const execution = executePracticeSql(generatedSql, dataset);

  const reply = `I've prepared the query for you! 💡

\`\`\`sql
${generatedSql}
\`\`\`

**Explanation:**
${explanation}

I have connected this directly to your **Practice Sandbox** panel. Click **"✍️ Fill in Editor"** to load the code, or **"⚡ Auto-Run in Panel"** to run it live immediately!`;

  return {
    reply,
    suggestedSql: generatedSql,
    suggestedTable: table,
    action: {
      type: "run_query",
      sql: generatedSql,
      table,
      message: "Ready to run in panel",
    },
    execution,
    provider: "querynest-sql-engine",
  };
}

/**
 * Main handler to ask the SQL Agent.
 * Runs via OpenAI Agents SDK when OPENAI_API_KEY is configured,
 * otherwise seamlessly falls back to the QueryNest SQL Engine.
 */
export async function askSqlAgent(userInput: string, apiKey?: string): Promise<AgentResponse> {
  const activeKey = apiKey || process.env.OPENAI_API_KEY;

  if (activeKey) {
    try {
      // Ensure API key is in env for OpenAI SDK
      process.env.OPENAI_API_KEY = activeKey;
      const agent = createSqlAgent();
      const runResult = await run(agent, userInput);
      const textOutput = runResult.finalOutput || "";

      // Extract SQL snippet if present
      const sqlMatch = textOutput.match(/```sql\s*([\s\S]*?)\s*```/i);
      const extractedSql = sqlMatch ? sqlMatch[1].trim() : undefined;

      let execution: SqlExecution | undefined;
      let suggestedTable = "employees";
      if (extractedSql) {
        execution = executePracticeSql(extractedSql, DEFAULT_PRACTICE_DATASET);
        if (extractedSql.toLowerCase().includes("students")) suggestedTable = "students";
        else if (extractedSql.toLowerCase().includes("orders")) suggestedTable = "orders";
      }

      return {
        reply: textOutput,
        suggestedSql: extractedSql,
        suggestedTable,
        action: extractedSql
          ? {
              type: "run_query",
              sql: extractedSql,
              table: suggestedTable,
              message: "Generated by OpenAI Agent",
            }
          : undefined,
        execution,
        provider: "openai-agents-sdk",
      };
    } catch (err) {
      console.warn("[SqlAgent] OpenAI Agents SDK run error, falling back to local engine:", (err as Error).message);
      // Fall through to local engine
    }
  }

  // Fallback to local intelligent SQL agent
  return generateLocalSqlResponse(userInput);
}

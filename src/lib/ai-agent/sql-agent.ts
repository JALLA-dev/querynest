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
1. Help students understand ANY SQL concept (SQL basics, databases, JOINs, GROUP BY, HAVING, subqueries, indexes, keys, aggregates, ACID, transactions).
2. Answer conceptual questions with structured headings, clear bullet points, and realistic code examples.
3. You have access to practice tables in the database:
   - "employees" (columns: id, name, department, salary, city)
   - "students" (columns: id, name, track, score, status)
   - "orders" (columns: id, customer, item, amount, status)
4. When a student asks how to write a query, or cannot write one:
   - Provide the complete, valid SQL query in a markdown \`\`\`sql code block.
   - Use the execute_sql_query tool to verify it works before answering.
   - Clearly explain each clause in beginner-friendly language.
5. Keep answers pedagogical, friendly, clear, and focused on learning.`,
    tools: [getSchemaTool, executeSqlTool],
  });
}

/**
 * Comprehensive Knowledge Base & Query Engine for answering SQL concepts,
 * theory, and data requests without needing an external API key.
 */
function generateLocalSqlResponse(userInput: string, dataset: PracticeDataset = DEFAULT_PRACTICE_DATASET): AgentResponse {
  const text = userInput.toLowerCase().trim();

  // -------------------------------------------------------------
  // 1. CONCEPTUAL & EXPLANATION QUESTIONS
  // -------------------------------------------------------------

  // What is SQL / Explain SQL / Explain about SQL
  if (
    text.includes("explain about sql") ||
    text.includes("what is sql") ||
    text.includes("explain sql") ||
    text === "sql" ||
    text.includes("learn sql") ||
    text.includes("about sql") ||
    text.includes("introduction to sql")
  ) {
    const sampleSql = "SELECT name, department, salary FROM employees WHERE salary > 65000 ORDER BY salary DESC";
    const execution = executePracticeSql(sampleSql, dataset);

    return {
      reply: `### 📚 What is SQL?

**SQL** stands for **Structured Query Language**. It is the standard programming language used worldwide to store, manipulate, query, and retrieve data from **Relational Database Management Systems (RDBMS)** such as PostgreSQL, MySQL, SQLite, Oracle, and SQL Server.

---

### 🔑 Key Categories of SQL:
1. **DQL (Data Query Language)**:
   - \`SELECT\`: Used to retrieve data from tables. *(Most common)*
2. **DML (Data Manipulation Language)**:
   - \`INSERT\`: Add new records.
   - \`UPDATE\`: Modify existing records.
   - \`DELETE\`: Remove records.
3. **DDL (Data Definition Language)**:
   - \`CREATE\`: Create tables, databases, views.
   - \`ALTER\`: Add, delete, or modify table columns.
   - \`DROP\`: Permanently delete a table or database.
4. **DCL & TCL (Control Languages)**:
   - \`GRANT\`, \`REVOKE\`: Control user security and permissions.
   - \`COMMIT\`, \`ROLLBACK\`: Manage database transactions.

---

### 💡 Core Query Structure:
\`\`\`sql
SELECT column1, column2
FROM table_name
WHERE condition
ORDER BY column1 DESC;
\`\`\`

Here is a live example you can try right now on your **employees** table:
\`\`\`sql
${sampleSql}
\`\`\``,
      suggestedSql: sampleSql,
      suggestedTable: "employees",
      action: {
        type: "run_query",
        sql: sampleSql,
        table: "employees",
        message: "Try running this starter SQL query in your panel!",
      },
      execution,
      provider: "querynest-sql-engine",
    };
  }

  // Database / RDBMS
  if (text.includes("what is database") || text.includes("what is a database") || text.includes("rdbms") || text.includes("relational database")) {
    return {
      reply: `### 🗄️ What is a Database & RDBMS?

A **Database** is an organized collection of structured data stored electronically in a computer system.

- **RDBMS (Relational Database Management System)** stores data in two-dimensional **Tables** containing **Rows** (records) and **Columns** (fields).
- Tables are connected to each other through **Relationships** using Keys (Primary Key and Foreign Key).
- Common relational databases include **PostgreSQL, SQLite, MySQL, and SQL Server**.

*Example Table Structure:*
| id | name | department | salary |
|---|---|---|---|
| 1 | Aarav | Engineering | 75000 |
| 2 | Priya | Design | 68000 |`,
      provider: "querynest-sql-engine",
    };
  }

  // JOINs
  if (text.includes("join") || text.includes("inner join") || text.includes("left join") || text.includes("types of join")) {
    return {
      reply: `### 🔗 SQL JOIN Types Explained

A \`JOIN\` clause is used to combine rows from two or more tables based on a related column between them.

1. **INNER JOIN**:
   - Returns only rows that have matching values in **both** tables.
   \`\`\`sql
   SELECT employees.name, departments.name 
   FROM employees 
   INNER JOIN departments ON employees.dept_id = departments.id;
   \`\`\`

2. **LEFT JOIN (LEFT OUTER JOIN)**:
   - Returns **all records from the left table**, and matched records from the right table. Missing matches become \`NULL\`.
   \`\`\`sql
   SELECT students.name, courses.title 
   FROM students 
   LEFT JOIN enrollments ON students.id = enrollments.student_id;
   \`\`\`

3. **RIGHT JOIN (RIGHT OUTER JOIN)**:
   - Returns **all records from the right table**, and matched records from the left table.

4. **FULL OUTER JOIN**:
   - Returns all records when there is a match in **either** the left or right table.`,
      provider: "querynest-sql-engine",
    };
  }

  // WHERE vs HAVING
  if (text.includes("having") || (text.includes("where") && text.includes("vs"))) {
    return {
      reply: `### ⚖️ WHERE vs HAVING Clause in SQL

Both clauses are used for filtering, but at different stages:

| Feature | \`WHERE\` Clause | \`HAVING\` Clause |
|---|---|---|
| **Applied When** | Filters rows **before** grouping or aggregations occur. | Filters groups **after** \`GROUP BY\` aggregation. |
| **With Aggregates?** | **Cannot** be used with aggregate functions (e.g. \`WHERE SUM(salary) > 50000\` is invalid). | **Can** filter aggregate functions (e.g. \`HAVING COUNT(*) > 5\`). |
| **Usage** | Works with \`SELECT\`, \`UPDATE\`, \`DELETE\`. | Used only with \`SELECT\` and \`GROUP BY\`. |

*Example:*
\`\`\`sql
SELECT department, AVG(salary) AS avg_sal
FROM employees
WHERE salary > 40000          -- Filters individual employees first
GROUP BY department
HAVING AVG(salary) > 70000;   -- Filters the aggregated departments
\`\`\``,
      provider: "querynest-sql-engine",
    };
  }

  // GROUP BY
  if (text.includes("group by")) {
    return {
      reply: `### 📊 SQL GROUP BY Clause

The \`GROUP BY\` statement groups rows that have the same values into summary rows, typically used with **Aggregate Functions** like \`COUNT()\`, \`MAX()\`, \`MIN()\`, \`SUM()\`, and \`AVG()\`.

*Example: Find average salary per department*
\`\`\`sql
SELECT department, COUNT(*) AS total_staff, AVG(salary) AS avg_salary
FROM employees
GROUP BY department;
\`\`\`

**Rule:** Any column in your \`SELECT\` list that is NOT an aggregate function must appear in the \`GROUP BY\` clause.`,
      provider: "querynest-sql-engine",
    };
  }

  // PRIMARY KEY / FOREIGN KEY
  if (text.includes("primary key") || text.includes("foreign key") || text.includes("keys in sql")) {
    return {
      reply: `### 🔑 Primary Key vs Foreign Key

- **Primary Key (PK)**:
  - Uniquely identifies each record in a database table.
  - Must contain **UNIQUE** values and **cannot be NULL**.
  - A table can have only one primary key.

- **Foreign Key (FK)**:
  - A field (or collection of fields) in one table that refers to the **Primary Key in another table**.
  - Enforces **Referential Integrity** between related tables.

*Example:*
\`\`\`sql
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    dept_id INT,
    FOREIGN KEY (dept_id) REFERENCES departments(id)
);
\`\`\``,
      provider: "querynest-sql-engine",
    };
  }

  // AGGREGATE FUNCTIONS
  if (text.includes("aggregate") || text.includes("count") || text.includes("sum") || text.includes("avg") || text.includes("min") || text.includes("max")) {
    if (!text.includes("show") && !text.includes("write") && !text.includes("find")) {
      return {
        reply: `### 📈 SQL Aggregate Functions

Aggregate functions perform a calculation on a set of rows and return a single summary value:

1. \`COUNT(*)\`: Returns the total number of rows.
2. \`SUM(column)\`: Calculates the sum of numeric values.
3. \`AVG(column)\`: Calculates the average value of a numeric column.
4. \`MIN(column)\`: Returns the smallest value.
5. \`MAX(column)\`: Returns the largest value.

*Example:*
\`\`\`sql
SELECT 
    COUNT(*) AS total_employees,
    AVG(salary) AS average_salary,
    MAX(salary) AS highest_salary,
    MIN(salary) AS lowest_salary
FROM employees;
\`\`\``,
        provider: "querynest-sql-engine",
      };
    }
  }

  // SUBQUERIES
  if (text.includes("subquery") || text.includes("subqueries") || text.includes("nested query")) {
    return {
      reply: `### 🪆 SQL Subqueries (Nested Queries)

A **Subquery** is a query nested inside another SQL statement such as \`SELECT\`, \`INSERT\`, \`UPDATE\`, or \`DELETE\`.

*Example: Find employees who earn more than the overall company average*
\`\`\`sql
SELECT name, salary, department
FROM employees
WHERE salary > (
    SELECT AVG(salary) FROM employees
);
\`\`\`

The inner query \`(SELECT AVG(salary) FROM employees)\` runs first and provides its result to the outer query.`,
      provider: "querynest-sql-engine",
    };
  }

  // INDEX
  if (text.includes("index") || text.includes("indexing")) {
    return {
      reply: `### ⚡ SQL Indexes

An **Index** is a special lookup table that the database search engine can use to speed up data retrieval. Think of it like an index at the back of a textbook: instead of scanning every page (table scan), you look up the topic directly.

*Syntax:*
\`\`\`sql
CREATE INDEX idx_employee_salary ON employees(salary);
\`\`\`

- **Pros**: Drastically speeds up \`SELECT\` queries with \`WHERE\` and \`ORDER BY\`.
- **Cons**: Slows down \`INSERT\`, \`UPDATE\`, and \`DELETE\` operations because the index must also be updated.`,
      provider: "querynest-sql-engine",
    };
  }

  // -------------------------------------------------------------
  // 2. QUERY WRITING & SANDBOX EXECUTION
  // -------------------------------------------------------------

  let table = "employees";
  let generatedSql = "";
  let explanation = "";

  if (text.includes("student") || text.includes("score") || text.includes("track") || text.includes("passed")) {
    table = "students";
  } else if (text.includes("order") || text.includes("customer") || text.includes("amount") || text.includes("item")) {
    table = "orders";
  }

  if (table === "employees") {
    if (text.includes("highest") || text.includes("top") || text.includes("richest") || text.includes("max salary")) {
      generatedSql = "SELECT name, department, salary FROM employees ORDER BY salary desc";
      explanation = "Selects employees and orders them from highest to lowest salary using `ORDER BY salary DESC`.";
    } else if (text.includes("lowest") || text.includes("minimum")) {
      generatedSql = "SELECT name, department, salary FROM employees ORDER BY salary asc";
      explanation = "Selects employees ordered from lowest to highest salary.";
    } else if (text.includes("engineering") || text.includes("engineer")) {
      generatedSql = "SELECT name, salary, city FROM employees WHERE department = 'Engineering'";
      explanation = "Filters the employees dataset for all team members in the 'Engineering' department.";
    } else if (text.includes("finance")) {
      generatedSql = "SELECT name, salary, city FROM employees WHERE department = 'Finance'";
      explanation = "Filters the employees dataset for team members in 'Finance'.";
    } else if (text.includes("marketing")) {
      generatedSql = "SELECT name, salary, city FROM employees WHERE department = 'Marketing'";
      explanation = "Filters for marketing staff members.";
    } else if (text.includes("bengaluru") || text.includes("bangalore")) {
      generatedSql = "SELECT name, department, salary FROM employees WHERE city = 'Bengaluru'";
      explanation = "Filters for all employees based in the city of Bengaluru.";
    } else if (text.includes("mumbai")) {
      generatedSql = "SELECT name, department, salary FROM employees WHERE city = 'Mumbai'";
      explanation = "Filters for all employees located in Mumbai.";
    } else if (text.includes("70") || text.includes("70000") || text.includes("70k")) {
      generatedSql = "SELECT name, department, salary FROM employees WHERE salary > 70000 ORDER BY salary desc";
      explanation = "Retrieves all employees with salaries greater than 70,000, ordered from highest to lowest.";
    } else if (text.includes("60") || text.includes("60000") || text.includes("60k")) {
      generatedSql = "SELECT name, department, salary FROM employees WHERE salary > 60000 ORDER BY salary desc";
      explanation = "Retrieves all employees with salaries greater than 60,000, ordered by highest salary.";
    } else if (text.includes("salary") && (text.includes("50") || text.includes("50000"))) {
      generatedSql = "SELECT name, department, salary FROM employees WHERE salary >= 50000";
      explanation = "Filters for employees earning at least 50,000.";
    } else {
      generatedSql = "SELECT name, department, salary, city FROM employees ORDER BY salary desc";
      explanation = "Retrieves all employees sorted by salary in descending order.";
    }
  } else if (table === "students") {
    if (text.includes("top") || text.includes("best") || text.includes("score") || text.includes("high")) {
      generatedSql = "SELECT name, track, score, status FROM students WHERE score >= 80 ORDER BY score desc";
      explanation = "Filters students with high scores (80+) and sorts by top performers first.";
    } else if (text.includes("practice") || text.includes("need") || text.includes("fail")) {
      generatedSql = "SELECT name, track, score, status FROM students WHERE status = 'Needs Practice'";
      explanation = "Filters for students marked as needing practice.";
    } else if (text.includes("analytics")) {
      generatedSql = "SELECT name, score, status FROM students WHERE track = 'Analytics'";
      explanation = "Lists all students enrolled in the Analytics track.";
    } else if (text.includes("sql")) {
      generatedSql = "SELECT name, score, status FROM students WHERE track = 'SQL' ORDER BY score desc";
      explanation = "Lists students in the SQL track ordered by their score.";
    } else {
      generatedSql = "SELECT * FROM students ORDER BY score desc";
      explanation = "Retrieves all students ordered by performance score.";
    }
  } else if (table === "orders") {
    if (text.includes("completed")) {
      generatedSql = "SELECT customer, item, amount FROM orders WHERE status = 'Completed'";
      explanation = "Filters for orders that have reached 'Completed' status.";
    } else if (text.includes("pending")) {
      generatedSql = "SELECT customer, item, amount FROM orders WHERE status = 'Pending'";
      explanation = "Filters for orders currently in 'Pending' status.";
    } else if (text.includes("1000") || text.includes("expensive") || text.includes("high")) {
      generatedSql = "SELECT customer, item, amount FROM orders WHERE amount >= 999 ORDER BY amount desc";
      explanation = "Lists high-value orders of 999 or more.";
    } else {
      generatedSql = "SELECT * FROM orders ORDER BY amount desc";
      explanation = "Lists all customer orders sorted from highest to lowest amount.";
    }
  }

  const execution = executePracticeSql(generatedSql, dataset);

  const reply = `I've prepared the query for you! 💡

\`\`\`sql
${generatedSql}
\`\`\`

**Explanation:**
${explanation}

You can click **"✍️ Fill in Editor"** to inject the query, or **"⚡ Auto-Run in Panel"** to run it live in your Practice Sandbox!`;

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
      console.warn("[SqlAgent] OpenAI Agents SDK run notice, using local engine:", (err as Error).message);
    }
  }

  // Use QueryNest SQL Engine
  return generateLocalSqlResponse(userInput);
}

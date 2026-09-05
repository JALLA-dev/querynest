import { executePracticeSql } from "@/lib/sql-engine";
import type { PracticeDataset } from "@/db/schema";

export const dynamic = "force-dynamic";

export const DEFAULT_PRACTICE_DATASET: PracticeDataset = {
  tables: {
    employees: [
      { id: 1, name: "Aarav", department: "Engineering", salary: 75000, city: "Bengaluru" },
      { id: 2, name: "Priya", department: "Design", salary: 68000, city: "Mumbai" },
      { id: 3, name: "Rahul", department: "Finance", salary: 65000, city: "Delhi" },
      { id: 4, name: "David", department: "IT", salary: 54000, city: "Hyderabad" },
      { id: 5, name: "Anika", department: "Marketing", salary: 50000, city: "Pune" },
      { id: 6, name: "Siddharth", department: "Engineering", salary: 82000, city: "Bengaluru" },
      { id: 7, name: "Meera", department: "Finance", salary: 72000, city: "Mumbai" },
    ],
    students: [
      { id: 101, name: "Karan", track: "SQL", score: 92, status: "Passed" },
      { id: 102, name: "Sneha", track: "SQL", score: 78, status: "Passed" },
      { id: 103, name: "Rohan", track: "Analytics", score: 85, status: "Passed" },
      { id: 104, name: "Tanvi", track: "SQL", score: 95, status: "Passed" },
      { id: 105, name: "Aditya", track: "Databases", score: 64, status: "Needs Practice" },
    ],
    orders: [
      { id: 1001, customer: "Aarav", item: "SQL Mastery", amount: 999, status: "Completed" },
      { id: 1002, customer: "Priya", item: "Verified Certificate", amount: 499, status: "Completed" },
      { id: 1003, customer: "Rahul", item: "Annual Pass", amount: 1999, status: "Pending" },
      { id: 1004, customer: "Anika", item: "SQL Mastery", amount: 999, status: "Completed" },
    ],
  },
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { query?: string; dataset?: PracticeDataset } | null;
  const query = body?.query ?? "";
  const dataset = body?.dataset ?? DEFAULT_PRACTICE_DATASET;
  const result = executePracticeSql(query, dataset);
  return Response.json(result);
}

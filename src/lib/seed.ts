import { count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  badges,
  courses,
  lessons,
  modules,
  notes,
  questions,
  quizzes,
  tasks,
  users,
  type JsonRow,
  type PracticeDataset,
  type SqlExample,
} from "@/db/schema";
import { hashPassword, slugify } from "./security";
import { ensureSchema } from "@/db/init";

let seedPromise: Promise<void> | null = null;

const adminId = "admin_querynest";
const studentId = "student_demo";
const courseId = "course_sql_mastery";

const lessonSeeds = [
  {
    moduleTitle: "SQL Fundamentals",
    lessons: [
      {
        title: "Introduction to SQL",
        description: "Understand what SQL is, where it is used, and how relational databases organize data.",
        concepts: ["Relational databases", "Tables", "Rows", "Columns", "SQL statements"],
        sqlExamples: [{ title: "Inspect a table", sql: "SELECT *\nFROM employees;", explanation: "The asterisk returns every available column from employees." }],
      },
      {
        title: "SELECT Statement",
        description: "Retrieve specific columns from a table and write readable SELECT queries.",
        concepts: ["SELECT", "FROM", "Projection", "Aliases"],
        sqlExamples: [{ title: "Select employee names", sql: "SELECT employee_name, salary\nFROM employees;", explanation: "Projection keeps only the columns needed for the result." }],
      },
    ],
  },
  {
    moduleTitle: "Filtering and Sorting",
    lessons: [
      {
        title: "WHERE Clause",
        description: "Filter rows using comparison operators and conditions.",
        concepts: ["WHERE", "Comparison operators", "AND", "LIKE"],
        sqlExamples: [{ title: "High salary employees", sql: "SELECT *\nFROM employees\nWHERE salary > 50000;", explanation: "WHERE evaluates each row and returns only matches." }],
      },
      {
        title: "ORDER BY Explained",
        description: "Sort query results by one or more columns for analysis-friendly output.",
        concepts: ["ORDER BY", "ASC", "DESC", "Stable result sets"],
        sqlExamples: [{ title: "Highest salary first", sql: "SELECT employee_name, salary\nFROM employees\nORDER BY salary DESC;", explanation: "DESC sorts the largest salary at the top." }],
      },
    ],
  },
  {
    moduleTitle: "Joins and Real Data",
    lessons: [
      {
        title: "INNER JOIN Explained",
        description: "Combine related tables and return rows where matching keys exist on both sides.",
        concepts: ["INNER JOIN", "Primary keys", "Foreign keys", "Result sets"],
        sqlExamples: [{ title: "Join employees to departments", sql: "SELECT employees.employee_name, departments.department_name\nFROM employees\nINNER JOIN departments ON employees.department_id = departments.id;", explanation: "INNER JOIN returns rows with matching department IDs." }],
      },
      {
        title: "Real-World SQL Project Brief",
        description: "Use SQL thinking to answer business questions from clean datasets.",
        concepts: ["Business questions", "Filtering", "Sorting", "Validation"],
        sqlExamples: [{ title: "IT employees", sql: "SELECT id, employee_name, department\nFROM employees\nWHERE department = 'IT';", explanation: "Start every analysis by returning the exact rows requested." }],
      },
    ],
  },
];

const sampleData: PracticeDataset = {
  tables: {
    employees: [
      { id: 1, employee_name: "John", department: "IT", salary: 72000 },
      { id: 2, employee_name: "Priya", department: "HR", salary: 48000 },
      { id: 3, employee_name: "Rahul", department: "Finance", salary: 65000 },
      { id: 4, employee_name: "David", department: "IT", salary: 54000 },
      { id: 5, employee_name: "Anika", department: "Marketing", salary: 50000 },
    ],
  },
};

async function seedUsers() {
  await db.insert(users).values([
    {
      id: adminId,
      name: "Querynest Instructor",
      email: "admin@querynest.dev",
      passwordHash: hashPassword("Querynest@123"),
      role: "ADMIN",
      avatarUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=querynest-admin",
      bio: "SQL instructor helping students turn database concepts into real skills.",
      streak: 12,
    },
    {
      id: studentId,
      name: "Demo Student",
      email: "student@querynest.dev",
      passwordHash: hashPassword("Querynest@123"),
      role: "STUDENT",
      avatarUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=querynest-student",
      bio: "Learning SQL step by step with Querynest.",
      streak: 5,
    },
  ]).onConflictDoNothing();
}

async function seedBadges() {
  await db.insert(badges).values([
    { id: "badge_beginner", name: "SQL Beginner", description: "Earned after collecting your first 50 points.", icon: "🌱", requiredPoints: 50 },
    { id: "badge_explorer", name: "SQL Explorer", description: "You are exploring filters, sorting, and query patterns.", icon: "🧭", requiredPoints: 150 },
    { id: "badge_practitioner", name: "SQL Practitioner", description: "You solve SQL tasks with confidence.", icon: "⚙️", requiredPoints: 350 },
    { id: "badge_master", name: "SQL Master", description: "Advanced learning milestone for consistent students.", icon: "🏆", requiredPoints: 800 },
  ]).onConflictDoNothing();
}

async function seedCourse() {
  await db.insert(courses).values({
    id: courseId,
    title: "SQL Mastery",
    slug: "sql-mastery",
    description: "A beginner-to-advanced path covering SELECT queries, filtering, joins, quizzes, practice tasks, and real-world projects.",
    longDescription: "SQL Mastery is Querynest's flagship learning path for students who want a practical, structured, and confidence-building SQL journey. Every module combines short videos, readable notes, SQL examples, practice tasks, quizzes, and points so learners always know what to do next.",
    instructorName: "Querynest Instructor",
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    difficulty: "Beginner → Advanced",
    durationMinutes: 480,
    totalPoints: 780,
    tags: ["SQL", "Databases", "Analytics", "Practice"],
    isPublished: true,
    createdById: adminId,
  }).onConflictDoNothing();

  let lessonOrder = 1;
  for (let moduleIndex = 0; moduleIndex < lessonSeeds.length; moduleIndex++) {
    const moduleSeed = lessonSeeds[moduleIndex];
    const moduleId = `module_${slugify(moduleSeed.moduleTitle)}`;
    await db.insert(modules).values({
      id: moduleId,
      courseId,
      title: moduleSeed.moduleTitle,
      description: `Master ${moduleSeed.moduleTitle.toLowerCase()} with guided videos, notes, examples, and checkpoints.`,
      orderIndex: moduleIndex + 1,
      points: 100,
      isPublished: true,
    }).onConflictDoNothing();

    for (const lessonSeed of moduleSeed.lessons) {
      const lessonId = `lesson_${slugify(lessonSeed.title)}`;
      await db.insert(lessons).values({
        id: lessonId,
        moduleId,
        courseId,
        title: lessonSeed.title,
        slug: slugify(lessonSeed.title),
        description: lessonSeed.description,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoProvider: "youtube",
        thumbnailUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
        durationMinutes: 9 + lessonOrder,
        orderIndex: lessonOrder,
        points: 10,
        concepts: lessonSeed.concepts,
        sqlExamples: lessonSeed.sqlExamples as SqlExample[],
        isPublished: true,
      }).onConflictDoNothing();

      await db.insert(notes).values({
        id: `note_${slugify(lessonSeed.title)}`,
        lessonId,
        title: `${lessonSeed.title} Notes`,
        markdown: `## ${lessonSeed.title}\n\n${lessonSeed.description}\n\n### SQL Example\n\n\`\`\`sql\n${lessonSeed.sqlExamples[0].sql}\n\`\`\`\n\n### Important points\n\n- Write SQL in small, readable steps.\n- Always confirm the table name and required columns.\n- Use filters only when the problem asks for a subset of rows.\n\n### Common mistake\n\nBeginners often select every column when the expected output asks for specific columns only.`,
      }).onConflictDoNothing();

      lessonOrder++;
    }
  }
}

async function seedTasksAndQuizzes() {
  const whereLessonId = "lesson_where-clause";
  const joinLessonId = "lesson_inner-join-explained";
  const moduleId = "module_filtering-and-sorting";

  const highSalaryExpected: JsonRow[] = [
    { id: 1, employee_name: "John", department: "IT", salary: 72000 },
    { id: 3, employee_name: "Rahul", department: "Finance", salary: 65000 },
    { id: 4, employee_name: "David", department: "IT", salary: 54000 },
  ];

  await db.insert(tasks).values([
    {
      id: "task_high_salary_employees",
      lessonId: whereLessonId,
      moduleId,
      courseId,
      title: "Find high salary employees",
      description: "Find all employees whose salary is greater than 50,000.",
      difficulty: "Easy",
      dbSchema: "employees(id INT, employee_name TEXT, department TEXT, salary INT)",
      sampleData,
      expectedOutput: highSalaryExpected,
      starterSql: "SELECT *\nFROM employees\nWHERE salary > 50000;",
      solutionSql: "SELECT *\nFROM employees\nWHERE salary > 50000;",
      hints: ["Use the WHERE clause.", "Compare the salary column with 50000."],
      points: 20,
      isPublished: true,
    },
    {
      id: "task_it_department",
      lessonId: joinLessonId,
      moduleId: "module_joins-and-real-data",
      courseId,
      title: "Return IT employees",
      description: "Return id, employee_name, and department for employees in the IT department.",
      difficulty: "Medium",
      dbSchema: "employees(id INT, employee_name TEXT, department TEXT, salary INT)",
      sampleData,
      expectedOutput: [
        { id: 1, employee_name: "John", department: "IT" },
        { id: 4, employee_name: "David", department: "IT" },
      ],
      starterSql: "SELECT id, employee_name, department\nFROM employees\nWHERE department = 'IT';",
      solutionSql: "SELECT id, employee_name, department\nFROM employees\nWHERE department = 'IT';",
      hints: ["Project only three columns.", "String values need quotes."],
      points: 30,
      isPublished: true,
    },
  ]).onConflictDoNothing();

  await db.insert(quizzes).values({
    id: "quiz_sql_fundamentals",
    moduleId: "module_sql-fundamentals",
    lessonId: "lesson_select-statement",
    courseId,
    title: "SQL Fundamentals Checkpoint",
    description: "Test your understanding of the first SQL commands and table concepts.",
    passingPercentage: 70,
    points: 80,
    isPublished: true,
  }).onConflictDoNothing();

  await db.insert(questions).values([
    {
      id: "question_select_command",
      quizId: "quiz_sql_fundamentals",
      prompt: "Which SQL command is used to retrieve data?",
      options: ["INSERT", "SELECT", "UPDATE", "DELETE"],
      correctAnswer: "SELECT",
      explanation: "SELECT retrieves data from one or more tables.",
      points: 10,
      orderIndex: 1,
    },
    {
      id: "question_filter_clause",
      quizId: "quiz_sql_fundamentals",
      prompt: "Which clause is used to filter rows?",
      options: ["WHERE", "GROUP BY", "ORDER BY", "HAVING"],
      correctAnswer: "WHERE",
      explanation: "WHERE filters rows before the final result is returned.",
      points: 10,
      orderIndex: 2,
    },
    {
      id: "question_table_row",
      quizId: "quiz_sql_fundamentals",
      prompt: "In a relational table, a row usually represents what?",
      options: ["A single record", "A database server", "A password", "A SQL keyword"],
      correctAnswer: "A single record",
      explanation: "Rows store individual records; columns describe the fields in those records.",
      points: 10,
      orderIndex: 3,
    },
  ]).onConflictDoNothing();
}

async function seed() {
  await ensureSchema();
  await seedUsers();
  await seedBadges();

  const [existingCourses] = await db.select({ value: count() }).from(courses);
  if ((existingCourses?.value ?? 0) === 0) {
    await seedCourse();
    await seedTasksAndQuizzes();
  }
}

export async function ensureSeeded() {
  try {
    seedPromise ??= seed();
    await seedPromise;
  } catch (e) {
    seedPromise = null;
    console.warn("[seed] Database not available, skipping seed:", (e as Error).message);
  }
}

export async function ensureCourseContent() {
  try {
    const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) {
      seedPromise = seed();
      await seedPromise;
    }
  } catch (e) {
    console.warn("[seed] Database not available, skipping course content check:", (e as Error).message);
  }
}


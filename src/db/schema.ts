import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type UserRole = "STUDENT" | "ADMIN";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Easy" | "Medium" | "Hard";
export type JsonPrimitive = string | number | boolean | null;
export type JsonRow = Record<string, JsonPrimitive>;
export type PracticeDataset = { tables: Record<string, JsonRow[]> };
export type SqlExample = { title: string; sql: string; explanation: string };
export type CertificateMeta = { certificateId: string; issuedAt: string };

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<UserRole>().notNull().default("STUDENT"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    streak: integer("streak").notNull().default(0),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  instructorName: text("instructor_name").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  difficulty: text("difficulty").notNull().default("Beginner"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(false),
  createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  points: integer("points").notNull().default(100),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url"),
  videoProvider: text("video_provider").default("external"),
  thumbnailUrl: text("thumbnail_url"),
  durationMinutes: integer("duration_minutes").notNull().default(8),
  orderIndex: integer("order_index").notNull().default(0),
  points: integer("points").notNull().default(10),
  concepts: jsonb("concepts").$type<string[]>().notNull().default([]),
  sqlExamples: jsonb("sql_examples").$type<SqlExample[]>().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  markdown: text("markdown").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  moduleId: text("module_id").references(() => modules.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().default("Easy"),
  dbSchema: text("db_schema").notNull(),
  sampleData: jsonb("sample_data").$type<PracticeDataset>().notNull(),
  expectedOutput: jsonb("expected_output").$type<JsonRow[]>().notNull(),
  starterSql: text("starter_sql").notNull().default("SELECT *\nFROM employees;"),
  solutionSql: text("solution_sql").notNull(),
  hints: jsonb("hints").$type<string[]>().notNull().default([]),
  points: integer("points").notNull().default(20),
  timeLimitMinutes: integer("time_limit_minutes"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").references(() => modules.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  passingPercentage: integer("passing_percentage").notNull().default(70),
  points: integer("points").notNull().default(50),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  points: integer("points").notNull().default(10),
  orderIndex: integer("order_index").notNull().default(0),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    progressPercent: integer("progress_percent").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    lastLessonId: text("last_lesson_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueEnrollment: uniqueIndex("enrollments_user_course_idx").on(table.userId, table.courseId),
  }),
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    pointsAwarded: integer("points_awarded").notNull().default(0),
  },
  (table) => ({
    uniqueLessonProgress: uniqueIndex("lesson_progress_user_lesson_idx").on(table.userId, table.lessonId),
  }),
);

export const taskSubmissions = pgTable("task_submissions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  result: jsonb("result").$type<JsonRow[]>().notNull().default([]),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
  percentage: integer("percentage").notNull().default(0),
  passed: boolean("passed").notNull().default(false),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const pointsTransactions = pgTable("points_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const badges = pgTable("badges", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("🏅"),
  requiredPoints: integer("required_points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserBadge: uniqueIndex("user_badges_user_badge_idx").on(table.userId, table.badgeId),
  }),
);

export const certificates = pgTable(
  "certificates",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    certificateId: text("certificate_id").notNull(),
    instructorName: text("instructor_name").notNull(),
    meta: jsonb("meta").$type<CertificateMeta>().notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueCertificate: uniqueIndex("certificates_user_course_idx").on(table.userId, table.courseId),
  }),
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueBookmark: uniqueIndex("bookmarks_user_lesson_idx").on(table.userId, table.lessonId),
  }),
);

export const siteVisits = pgTable("site_visits", {
  id: text("id").primaryKey(),
  path: text("path").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  referer: text("referer"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  userRole: text("user_role").default("GUEST"),
  userName: text("user_name"),
  visitedAt: timestamp("visited_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

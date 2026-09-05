import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export type UserRole = "STUDENT" | "ADMIN";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Easy" | "Medium" | "Hard";
export type JsonPrimitive = string | number | boolean | null;
export type JsonRow = Record<string, JsonPrimitive>;
export type PracticeDataset = { tables: Record<string, JsonRow[]> };
export type SqlExample = { title: string; sql: string; explanation: string };
export type CertificateMeta = { certificateId: string; issuedAt: string };

// Helper: SQLite stores JSON as text, booleans as 0/1, timestamps as epoch ms

export const users = sqliteTable(
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
    lastActiveAt: integer("last_active_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const courses = sqliteTable("courses", {
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
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  points: integer("points").notNull().default(100),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const lessons = sqliteTable("lessons", {
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
  concepts: text("concepts", { mode: "json" }).$type<string[]>().notNull().default([]),
  sqlExamples: text("sql_examples", { mode: "json" }).$type<SqlExample[]>().notNull().default([]),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  markdown: text("markdown").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  moduleId: text("module_id").references(() => modules.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().default("Easy"),
  dbSchema: text("db_schema").notNull(),
  sampleData: text("sample_data", { mode: "json" }).$type<PracticeDataset>().notNull(),
  expectedOutput: text("expected_output", { mode: "json" }).$type<JsonRow[]>().notNull(),
  starterSql: text("starter_sql").notNull().default("SELECT *\nFROM employees;"),
  solutionSql: text("solution_sql").notNull(),
  hints: text("hints", { mode: "json" }).$type<string[]>().notNull().default([]),
  points: integer("points").notNull().default(20),
  timeLimitMinutes: integer("time_limit_minutes"),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").references(() => modules.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  passingPercentage: integer("passing_percentage").notNull().default(70),
  points: integer("points").notNull().default(50),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  options: text("options", { mode: "json" }).$type<string[]>().notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  points: integer("points").notNull().default(10),
  orderIndex: integer("order_index").notNull().default(0),
});

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    progressPercent: integer("progress_percent").notNull().default(0),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    lastLessonId: text("last_lesson_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    uniqueEnrollment: uniqueIndex("enrollments_user_course_idx").on(table.userId, table.courseId),
  }),
);

export const lessonProgress = sqliteTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: integer("completed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    pointsAwarded: integer("points_awarded").notNull().default(0),
  },
  (table) => ({
    uniqueLessonProgress: uniqueIndex("lesson_progress_user_lesson_idx").on(table.userId, table.lessonId),
  }),
);

export const taskSubmissions = sqliteTable("task_submissions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
  result: text("result", { mode: "json" }).$type<JsonRow[]>().notNull().default([]),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
  percentage: integer("percentage").notNull().default(0),
  passed: integer("passed", { mode: "boolean" }).notNull().default(false),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  answers: text("answers", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const pointsTransactions = sqliteTable("points_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const badges = sqliteTable("badges", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("🏅"),
  requiredPoints: integer("required_points").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const userBadges = sqliteTable(
  "user_badges",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
    awardedAt: integer("awarded_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    uniqueUserBadge: uniqueIndex("user_badges_user_badge_idx").on(table.userId, table.badgeId),
  }),
);

export const certificates = sqliteTable(
  "certificates",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    certificateId: text("certificate_id").notNull(),
    instructorName: text("instructor_name").notNull(),
    meta: text("meta", { mode: "json" }).$type<CertificateMeta>().notNull(),
    issuedAt: integer("issued_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    uniqueCertificate: uniqueIndex("certificates_user_course_idx").on(table.userId, table.courseId),
  }),
);

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    uniqueBookmark: uniqueIndex("bookmarks_user_lesson_idx").on(table.userId, table.lessonId),
  }),
);

export const siteVisits = sqliteTable("site_visits", {
  id: text("id").primaryKey(),
  path: text("path").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  referer: text("referer"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  userRole: text("user_role").default("GUEST"),
  userName: text("user_name"),
  visitedAt: integer("visited_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

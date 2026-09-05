import { pool } from "@/db";

let schemaInitialized = false;

const ddlStatements = [
  // 1. users table
  `CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text,
    role text DEFAULT 'STUDENT' NOT NULL,
    avatar_url text,
    bio text,
    streak integer DEFAULT 0 NOT NULL,
    last_active_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // Safe ALTER TABLEs for users to reconcile backend and frontend schemas
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password text DEFAULT 'password123';`,
  `ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'STUDENT';`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak integer DEFAULT 0;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS completed_courses integer DEFAULT 0;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS tasks_solved integer DEFAULT 0;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);`,

  // 2. courses
  `CREATE TABLE IF NOT EXISTS courses (
    id text PRIMARY KEY NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    long_description text,
    instructor_name text NOT NULL,
    thumbnail_url text,
    difficulty text DEFAULT 'Beginner' NOT NULL,
    duration_minutes integer DEFAULT 0 NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_by_id text REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 3. modules
  `CREATE TABLE IF NOT EXISTS modules (
    id text PRIMARY KEY NOT NULL,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 100 NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 4. lessons
  `CREATE TABLE IF NOT EXISTS lessons (
    id text PRIMARY KEY NOT NULL,
    module_id text NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    video_url text,
    video_provider text DEFAULT 'external',
    thumbnail_url text,
    duration_minutes integer DEFAULT 8 NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 10 NOT NULL,
    concepts jsonb DEFAULT '[]'::jsonb NOT NULL,
    sql_examples jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 5. notes
  `CREATE TABLE IF NOT EXISTS notes (
    id text PRIMARY KEY NOT NULL,
    lesson_id text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title text NOT NULL,
    markdown text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 6. tasks
  `CREATE TABLE IF NOT EXISTS tasks (
    id text PRIMARY KEY NOT NULL,
    lesson_id text REFERENCES lessons(id) ON DELETE CASCADE,
    module_id text REFERENCES modules(id) ON DELETE CASCADE,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    difficulty text DEFAULT 'Easy' NOT NULL,
    db_schema text NOT NULL,
    sample_data jsonb NOT NULL,
    expected_output jsonb NOT NULL,
    starter_sql text DEFAULT 'SELECT *\nFROM employees;' NOT NULL,
    solution_sql text NOT NULL,
    hints jsonb DEFAULT '[]'::jsonb NOT NULL,
    points integer DEFAULT 20 NOT NULL,
    time_limit_minutes integer,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 7. quizzes
  `CREATE TABLE IF NOT EXISTS quizzes (
    id text PRIMARY KEY NOT NULL,
    module_id text REFERENCES modules(id) ON DELETE CASCADE,
    lesson_id text REFERENCES lessons(id) ON DELETE CASCADE,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    passing_percentage integer DEFAULT 70 NOT NULL,
    points integer DEFAULT 50 NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 8. questions
  `CREATE TABLE IF NOT EXISTS questions (
    id text PRIMARY KEY NOT NULL,
    quiz_id text NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    prompt text NOT NULL,
    options jsonb NOT NULL,
    correct_answer text NOT NULL,
    explanation text NOT NULL,
    points integer DEFAULT 10 NOT NULL,
    order_index integer DEFAULT 0 NOT NULL
  );`,

  // 9. enrollments
  `CREATE TABLE IF NOT EXISTS enrollments (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress_percent integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    last_lesson_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS enrollments_user_course_idx ON enrollments (user_id, course_id);`,

  // 10. lesson_progress
  `CREATE TABLE IF NOT EXISTS lesson_progress (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    points_awarded integer DEFAULT 0 NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_user_lesson_idx ON lesson_progress (user_id, lesson_id);`,

  // 11. task_submissions
  `CREATE TABLE IF NOT EXISTS task_submissions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    query text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    result jsonb DEFAULT '[]'::jsonb NOT NULL,
    points_awarded integer DEFAULT 0 NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 12. quiz_attempts
  `CREATE TABLE IF NOT EXISTS quiz_attempts (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id text NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score integer DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    percentage integer DEFAULT 0 NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    points_awarded integer DEFAULT 0 NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 13. points_transactions
  `CREATE TABLE IF NOT EXISTS points_transactions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points integer NOT NULL,
    reason text NOT NULL,
    reference_type text,
    reference_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 14. badges
  `CREATE TABLE IF NOT EXISTS badges (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text DEFAULT '🏅' NOT NULL,
    required_points integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // 15. user_badges
  `CREATE TABLE IF NOT EXISTS user_badges (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id text NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_badges_user_badge_idx ON user_badges (user_id, badge_id);`,

  // 16. certificates
  `CREATE TABLE IF NOT EXISTS certificates (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_id text NOT NULL,
    instructor_name text NOT NULL,
    meta jsonb NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_course_idx ON certificates (user_id, course_id);`,

  // 17. bookmarks
  `CREATE TABLE IF NOT EXISTS bookmarks (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_lesson_idx ON bookmarks (user_id, lesson_id);`,

  // 18. site_visits
  `CREATE TABLE IF NOT EXISTS site_visits (
    id text PRIMARY KEY NOT NULL,
    path text NOT NULL,
    ip text,
    user_agent text,
    referer text,
    user_id text REFERENCES users(id) ON DELETE SET NULL,
    user_role text DEFAULT 'GUEST',
    user_name text,
    visited_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
];

export async function ensureSchema() {
  if (schemaInitialized) return;

  // Execute each statement individually so a failure in one cannot abort the others
  for (const statement of ddlStatements) {
    try {
      // pool.query without parameters uses PostgreSQL Simple Query Protocol
      await pool.query(statement);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // Ignore non-critical notices such as column does not exist for ALTER COLUMN DROP NOT NULL
      if (error?.code !== "42703" && error?.code !== "42P07") {
        console.warn("[ensureSchema] DDL notice:", error?.message);
      }
    }
  }

  schemaInitialized = true;
}

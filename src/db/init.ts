import { pool } from "@/db";

let initPromise: Promise<void> | null = null;

const schemaStatements: string[] = [
  // ==========================================
  // 1. users
  // ==========================================
  `CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL DEFAULT 'Learner',
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
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Learner';`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;`,
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
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notes_access_enabled boolean DEFAULT false;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notes_access_expires_at timestamp with time zone;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS video_access_enabled boolean DEFAULT false;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS video_access_expires_at timestamp with time zone;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);`,

  // ==========================================
  // 2. courses
  // ==========================================
  `CREATE TABLE IF NOT EXISTS courses (
    id text PRIMARY KEY NOT NULL,
    title text NOT NULL DEFAULT 'Untitled Course',
    slug text NOT NULL DEFAULT 'course',
    description text NOT NULL DEFAULT '',
    long_description text,
    instructor_name text NOT NULL DEFAULT 'Querynest Instructor',
    thumbnail_url text,
    difficulty text DEFAULT 'Beginner' NOT NULL,
    duration_minutes integer DEFAULT 0 NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_by_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Untitled Course';`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT 'course';`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS long_description text;`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_name text DEFAULT 'Querynest Instructor';`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url text;`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'Beginner';`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 0;`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0;`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_by_id text;`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrolled_count integer DEFAULT 0;`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS progress_percent integer DEFAULT 0;`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS status text DEFAULT 'Published';`,

  // ==========================================
  // 3. modules
  // ==========================================
  `CREATE TABLE IF NOT EXISTS modules (
    id text PRIMARY KEY NOT NULL,
    course_id text NOT NULL DEFAULT 'course_sql_mastery',
    title text NOT NULL DEFAULT 'Module',
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 100 NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS course_id text NOT NULL DEFAULT 'course_sql_mastery';`,
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Module';`,
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS description text;`,
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;`,
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;`,
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS points integer DEFAULT 100;`,
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;`,
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`,

  // ==========================================
  // 4. lessons
  // ==========================================
  `CREATE TABLE IF NOT EXISTS lessons (
    id text PRIMARY KEY NOT NULL,
    module_id text NOT NULL,
    course_id text NOT NULL DEFAULT 'course_sql_mastery',
    title text NOT NULL DEFAULT 'Lesson',
    slug text NOT NULL DEFAULT 'lesson',
    description text NOT NULL DEFAULT '',
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
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS module_id text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS course_id text NOT NULL DEFAULT 'course_sql_mastery';`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Lesson';`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT 'lesson';`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_provider text DEFAULT 'external';`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS thumbnail_url text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 8;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS lesson_tag text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS points integer DEFAULT 10;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS concepts jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS sql_examples jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS notes text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS core_concept text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS syntax_example text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS initial_query text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS expected_query text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS task_description text;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`,
  `UPDATE lessons SET course_id = 'course_sql_mastery' WHERE course_id IS NULL;`,

  // ==========================================
  // 5. notes
  // ==========================================
  `CREATE TABLE IF NOT EXISTS notes (
    id text PRIMARY KEY NOT NULL,
    lesson_id text NOT NULL,
    title text NOT NULL DEFAULT 'Notes',
    markdown text NOT NULL DEFAULT '',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE notes ADD COLUMN IF NOT EXISTS lesson_id text;`,
  `ALTER TABLE notes ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Notes';`,
  `ALTER TABLE notes ADD COLUMN IF NOT EXISTS markdown text NOT NULL DEFAULT '';`,
  `ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`,

  // ==========================================
  // 6. tasks (Fixes: column tasks.course_id does not exist)
  // ==========================================
  `CREATE TABLE IF NOT EXISTS tasks (
    id text PRIMARY KEY NOT NULL,
    lesson_id text,
    module_id text,
    course_id text NOT NULL DEFAULT 'course_sql_mastery',
    title text NOT NULL DEFAULT 'Practice Task',
    description text NOT NULL DEFAULT '',
    difficulty text DEFAULT 'Easy' NOT NULL,
    db_schema text NOT NULL DEFAULT 'CREATE TABLE employees (id INT, employee_name TEXT, department TEXT, salary INT);',
    sample_data jsonb NOT NULL DEFAULT '{"tables":{"employees":[]}}'::jsonb,
    expected_output jsonb NOT NULL DEFAULT '[]'::jsonb,
    starter_sql text DEFAULT 'SELECT *\nFROM employees;' NOT NULL,
    solution_sql text NOT NULL DEFAULT 'SELECT *\nFROM employees;',
    hints jsonb DEFAULT '[]'::jsonb NOT NULL,
    points integer DEFAULT 20 NOT NULL,
    time_limit_minutes integer,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lesson_id text;`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS module_id text;`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS course_id text NOT NULL DEFAULT 'course_sql_mastery';`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Practice Task';`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'Easy';`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS db_schema text DEFAULT 'CREATE TABLE employees (id INT, employee_name TEXT, department TEXT, salary INT);';`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sample_data jsonb DEFAULT '{"tables":{"employees":[]}}'::jsonb;`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS expected_output jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS starter_sql text DEFAULT 'SELECT *\nFROM employees;';`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS solution_sql text DEFAULT 'SELECT *\nFROM employees;';`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS hints jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS points integer DEFAULT 20;`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_limit_minutes integer;`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`,
  `UPDATE tasks SET course_id = 'course_sql_mastery' WHERE course_id IS NULL;`,

  // ==========================================
  // 7. quizzes
  // ==========================================
  `CREATE TABLE IF NOT EXISTS quizzes (
    id text PRIMARY KEY NOT NULL,
    module_id text,
    lesson_id text,
    course_id text NOT NULL DEFAULT 'course_sql_mastery',
    title text NOT NULL DEFAULT 'Quiz',
    description text,
    passing_percentage integer DEFAULT 70 NOT NULL,
    points integer DEFAULT 50 NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS module_id text;`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS lesson_id text;`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS course_id text NOT NULL DEFAULT 'course_sql_mastery';`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Quiz';`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description text;`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS passing_percentage integer DEFAULT 70;`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS points integer DEFAULT 50;`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`,
  `UPDATE quizzes SET course_id = 'course_sql_mastery' WHERE course_id IS NULL;`,

  // ==========================================
  // 8. questions
  // ==========================================
  `CREATE TABLE IF NOT EXISTS questions (
    id text PRIMARY KEY NOT NULL,
    quiz_id text NOT NULL,
    prompt text NOT NULL DEFAULT '',
    options jsonb NOT NULL DEFAULT '[]'::jsonb,
    correct_answer text NOT NULL DEFAULT '',
    explanation text NOT NULL DEFAULT '',
    points integer DEFAULT 10 NOT NULL,
    order_index integer DEFAULT 0 NOT NULL
  );`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS quiz_id text;`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS prompt text NOT NULL DEFAULT '';`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS options jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer text NOT NULL DEFAULT '';`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation text NOT NULL DEFAULT '';`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS points integer DEFAULT 10;`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;`,

  // ==========================================
  // 9. enrollments
  // ==========================================
  `CREATE TABLE IF NOT EXISTS enrollments (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    course_id text NOT NULL,
    progress_percent integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    last_lesson_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS user_id text;`,
  `ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS course_id text;`,
  `ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS progress_percent integer DEFAULT 0;`,
  `ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;`,
  `ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS last_lesson_id text;`,
  `ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`,
  `CREATE UNIQUE INDEX IF NOT EXISTS enrollments_user_course_idx ON enrollments (user_id, course_id);`,

  // ==========================================
  // 10. lesson_progress
  // ==========================================
  `CREATE TABLE IF NOT EXISTS lesson_progress (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    course_id text NOT NULL DEFAULT 'course_sql_mastery',
    lesson_id text NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    points_awarded integer DEFAULT 0 NOT NULL
  );`,
  `ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS user_id text;`,
  `ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS course_id text NOT NULL DEFAULT 'course_sql_mastery';`,
  `ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS lesson_id text;`,
  `ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone DEFAULT now();`,
  `ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS points_awarded integer DEFAULT 0;`,
  `UPDATE lesson_progress SET course_id = 'course_sql_mastery' WHERE course_id IS NULL;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_user_lesson_idx ON lesson_progress (user_id, lesson_id);`,

  // ==========================================
  // 11. task_submissions
  // ==========================================
  `CREATE TABLE IF NOT EXISTS task_submissions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    task_id text NOT NULL,
    query text NOT NULL DEFAULT '',
    is_correct boolean DEFAULT false NOT NULL,
    result jsonb DEFAULT '[]'::jsonb NOT NULL,
    points_awarded integer DEFAULT 0 NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS user_id text;`,
  `ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS task_id text;`,
  `ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS query text DEFAULT '';`,
  `ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS is_correct boolean DEFAULT false;`,
  `ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS result jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS points_awarded integer DEFAULT 0;`,
  `ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone DEFAULT now();`,

  // ==========================================
  // 12. quiz_attempts
  // ==========================================
  `CREATE TABLE IF NOT EXISTS quiz_attempts (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    quiz_id text NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    percentage integer DEFAULT 0 NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    points_awarded integer DEFAULT 0 NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS user_id text;`,
  `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS quiz_id text;`,
  `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;`,
  `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 0;`,
  `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS percentage integer DEFAULT 0;`,
  `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS passed boolean DEFAULT false;`,
  `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS points_awarded integer DEFAULT 0;`,
  `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS answers jsonb DEFAULT '{}'::jsonb;`,
  `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone DEFAULT now();`,

  // ==========================================
  // 13. points_transactions
  // ==========================================
  `CREATE TABLE IF NOT EXISTS points_transactions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    reason text NOT NULL DEFAULT 'Activity',
    reference_type text,
    reference_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE points_transactions ADD COLUMN IF NOT EXISTS user_id text;`,
  `ALTER TABLE points_transactions ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;`,
  `ALTER TABLE points_transactions ADD COLUMN IF NOT EXISTS reason text DEFAULT 'Activity';`,
  `ALTER TABLE points_transactions ADD COLUMN IF NOT EXISTS reference_type text;`,
  `ALTER TABLE points_transactions ADD COLUMN IF NOT EXISTS reference_id text;`,
  `ALTER TABLE points_transactions ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,

  // ==========================================
  // 14. badges
  // ==========================================
  `CREATE TABLE IF NOT EXISTS badges (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL DEFAULT 'Badge',
    description text NOT NULL DEFAULT '',
    icon text DEFAULT '🏅' NOT NULL,
    required_points integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE badges ADD COLUMN IF NOT EXISTS name text DEFAULT 'Badge';`,
  `ALTER TABLE badges ADD COLUMN IF NOT EXISTS description text DEFAULT '';`,
  `ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon text DEFAULT '🏅';`,
  `ALTER TABLE badges ADD COLUMN IF NOT EXISTS required_points integer DEFAULT 0;`,
  `ALTER TABLE badges ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,

  // ==========================================
  // 15. user_badges
  // ==========================================
  `CREATE TABLE IF NOT EXISTS user_badges (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    badge_id text NOT NULL,
    awarded_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS user_id text;`,
  `ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS badge_id text;`,
  `ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS awarded_at timestamp with time zone DEFAULT now();`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_badges_user_badge_idx ON user_badges (user_id, badge_id);`,

  // ==========================================
  // 16. certificates
  // ==========================================
  `CREATE TABLE IF NOT EXISTS certificates (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    course_id text NOT NULL,
    certificate_id text NOT NULL,
    instructor_name text DEFAULT 'Querynest Instructor' NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS user_id text;`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_id text;`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_id text;`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS instructor_name text DEFAULT 'Querynest Instructor';`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_at timestamp with time zone DEFAULT now();`,
  `CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_course_idx ON certificates (user_id, course_id);`,

  // ==========================================
  // 17. bookmarks
  // ==========================================
  `CREATE TABLE IF NOT EXISTS bookmarks (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    lesson_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id text;`,
  `ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS lesson_id text;`,
  `ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`,
  `CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_lesson_idx ON bookmarks (user_id, lesson_id);`,

  // ==========================================
  // 18. site_visits
  // ==========================================
  `CREATE TABLE IF NOT EXISTS site_visits (
    id text PRIMARY KEY NOT NULL,
    path text NOT NULL DEFAULT '/',
    ip text,
    user_agent text,
    referer text,
    user_id text,
    user_role text DEFAULT 'GUEST',
    user_name text,
    visited_at timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS path text DEFAULT '/';`,
  `ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS ip text;`,
  `ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS user_agent text;`,
  `ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS referer text;`,
  `ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS user_id text;`,
  `ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS user_role text DEFAULT 'GUEST';`,
  `ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS user_name text;`,
  `ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS visited_at timestamp with time zone DEFAULT now();`,
];

async function runSchemaInit(): Promise<void> {
  const globalObj = globalThis as typeof globalThis & { __querynestSchemaEnsured?: boolean };
  if (globalObj.__querynestSchemaEnsured) return;

  try {
    // Execute all statements in a single network round-trip for blazing fast performance
    await pool.query(schemaStatements.join("\n"));
    globalObj.__querynestSchemaEnsured = true;
  } catch (batchErr) {
    // If multi-statement fails, fallback to resilient individual execution
    for (const stmt of schemaStatements) {
      try {
        await pool.query(stmt);
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        if (error?.code !== "42703" && error?.code !== "42P07" && error?.code !== "42701") {
          // ignore benign DDL notices
        }
      }
    }
    globalObj.__querynestSchemaEnsured = true;
  }
}

export function ensureSchema(): Promise<void> {
  const globalObj = globalThis as typeof globalThis & { __querynestSchemaEnsured?: boolean };
  if (globalObj.__querynestSchemaEnsured) {
    return Promise.resolve();
  }

  if (!initPromise) {
    initPromise = runSchemaInit().catch((err) => {
      initPromise = null;
      console.warn("[ensureSchema] Non-critical schema notice:", (err as Error)?.message);
    });
  }
  return initPromise;
}

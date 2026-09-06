import { and, asc, count, desc, eq, like, inArray, isNull, or, sql, sum } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  badges,
  bookmarks,
  certificates,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  modules,
  notes,
  pointsTransactions,
  questions,
  quizAttempts,
  quizzes,
  siteVisits,
  taskSubmissions,
  tasks,
  userBadges,
  users,
  type JsonRow,
} from "@/db/schema";
import { hashPassword, verifyPassword } from "./security";
import { ensureSchema } from "@/db/init";


export function levelFromPoints(points: number) {
  if (points >= 1000) return "SQL Master";
  if (points >= 600) return "SQL Developer";
  if (points >= 300) return "SQL Practitioner";
  if (points >= 100) return "SQL Explorer";
  return "SQL Beginner";
}

export async function getTotalPoints(userId: string) {
  const [row] = await db
    .select({ total: sum(pointsTransactions.points) })
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, userId));
  return Number(row?.total ?? 0);
}

export async function awardPoints(userId: string, points: number, reason: string, referenceType?: string, referenceId?: string) {
  if (points <= 0) return 0;
  if (referenceType && referenceId) {
    const [existing] = await db
      .select({ id: pointsTransactions.id })
      .from(pointsTransactions)
      .where(and(eq(pointsTransactions.userId, userId), eq(pointsTransactions.referenceType, referenceType), eq(pointsTransactions.referenceId, referenceId)))
      .limit(1);
    if (existing) return 0;
  }

  await db.insert(pointsTransactions).values({
    id: nanoid(),
    userId,
    points,
    reason,
    referenceType,
    referenceId,
  });
  await refreshBadges(userId);
  return points;
}

export async function refreshBadges(userId: string) {
  const total = await getTotalPoints(userId);
  const earned = await db.select().from(badges).where(sql`${badges.requiredPoints} <= ${total}`);
  for (const badge of earned) {
    await db.insert(userBadges).values({ id: nanoid(), userId, badgeId: badge.id }).onConflictDoNothing();
  }
}

export async function getPublishedCourses() {
  await ensureSchema();
  return db.select().from(courses).where(eq(courses.isPublished, true)).orderBy(desc(courses.createdAt));
}

export async function getCourseCounts(courseId: string) {
  await ensureSchema();
  try {
    const [[lessonCount], [quizCount], [taskCount]] = await Promise.all([
      db.select({ value: count() }).from(lessons).where(and(eq(lessons.courseId, courseId), eq(lessons.isPublished, true))),
      db.select({ value: count() }).from(quizzes).where(and(eq(quizzes.courseId, courseId), eq(quizzes.isPublished, true))),
      db.select({ value: count() }).from(tasks).where(and(eq(tasks.courseId, courseId), eq(tasks.isPublished, true))),
    ]);
    return {
      lessons: lessonCount?.value ?? 0,
      quizzes: quizCount?.value ?? 0,
      tasks: taskCount?.value ?? 0,
    };
  } catch (e) {
    console.warn("[data] getCourseCounts notice:", (e as Error).message);
    return {
      lessons: 0,
      quizzes: 0,
      tasks: 0,
    };
  }
}

export async function getCourseWithOutline(courseIdOrSlug: string) {
  await ensureSchema();
  const [course] = await db
    .select()
    .from(courses)
    .where(or(eq(courses.id, courseIdOrSlug), eq(courses.slug, courseIdOrSlug)))
    .limit(1);
  if (!course) return null;
  const courseId = course.id;
  const [moduleRows, lessonRows, taskRows, quizRows] = await Promise.all([
    db.select().from(modules).where(eq(modules.courseId, courseId)).orderBy(asc(modules.orderIndex)),
    db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.orderIndex)),
    db.select().from(tasks).where(eq(tasks.courseId, courseId)).orderBy(asc(tasks.createdAt)),
    db.select().from(quizzes).where(eq(quizzes.courseId, courseId)).orderBy(asc(quizzes.createdAt)),
  ]);
  return {
    course,
    modules: moduleRows.map((module) => ({
      ...module,
      lessons: lessonRows.filter((lesson) => lesson.moduleId === module.id),
      tasks: taskRows.filter((task) => task.moduleId === module.id),
      quizzes: quizRows.filter((quiz) => quiz.moduleId === module.id),
    })),
    tasks: taskRows,
    quizzes: quizRows,
  };
}

export async function getEnrollment(userId: string, courseId: string) {
  const [row] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);
  return row ?? null;
}

export async function enrollUser(userId: string, courseId: string) {
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) throw new Error("Course not found");
  await db.insert(enrollments).values({ id: nanoid(), userId, courseId }).onConflictDoNothing();
  return getEnrollment(userId, courseId);
}

export async function recalculateCourseProgress(userId: string, courseId: string, lastLessonId?: string) {
  const [[totalLessons], [completedLessons]] = await Promise.all([
    db.select({ value: count() }).from(lessons).where(and(eq(lessons.courseId, courseId), eq(lessons.isPublished, true))),
    db.select({ value: count() }).from(lessonProgress).where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId))),
  ]);
  const total = totalLessons?.value ?? 0;
  const completed = completedLessons?.value ?? 0;
  const progressPercent = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  const completedAt = progressPercent === 100 ? new Date() : null;
  await db
    .update(enrollments)
    .set({ progressPercent, completedAt, lastLessonId, updatedAt: new Date() })
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

  if (progressPercent === 100) await createCertificateIfNeeded(userId, courseId);
  return { progressPercent, completed, total };
}

export async function completeLesson(userId: string, lessonId: string) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson) throw new Error("Lesson not found");
  await enrollUser(userId, lesson.courseId);
  const [existing] = await db
    .select({ id: lessonProgress.id })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);
  let awarded = 0;
  if (!existing) {
    awarded = await awardPoints(userId, lesson.points, `Completed lesson: ${lesson.title}`, "lesson", lesson.id);
    await db.insert(lessonProgress).values({ id: nanoid(), userId, courseId: lesson.courseId, lessonId, pointsAwarded: awarded }).onConflictDoNothing();
  }
  const progress = await recalculateCourseProgress(userId, lesson.courseId, lessonId);
  return { awarded, progress };
}

export async function createCertificateIfNeeded(userId: string, courseId: string) {
  const [existing] = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
    .limit(1);
  if (existing) return existing.id;
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return null;
  const certificateId = `QN-${Date.now().toString(36).toUpperCase()}-${userId.slice(0, 4).toUpperCase()}`;
  await db.insert(certificates).values({
    id: nanoid(),
    userId,
    courseId,
    certificateId,
    instructorName: course.instructorName,
    meta: { certificateId, issuedAt: new Date().toISOString() },
  }).onConflictDoNothing();
  await awardPoints(userId, 500, `Completed course: ${course.title}`, "course", course.id);
  return certificateId;
}

export async function getDashboardData(userId: string) {
  const [enrolledRows, completedCourses, completedLessons, completedTasks, quizTotals, totalPoints] = await Promise.all([
    db
      .select({ enrollment: enrollments, course: courses })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.updatedAt)),
    db.select({ value: count() }).from(enrollments).where(and(eq(enrollments.userId, userId), sql`${enrollments.completedAt} is not null`)),
    db.select({ value: count() }).from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select({ value: count() }).from(taskSubmissions).where(and(eq(taskSubmissions.userId, userId), eq(taskSubmissions.isCorrect, true))),
    db.select({ total: sum(quizAttempts.pointsAwarded), count: count() }).from(quizAttempts).where(eq(quizAttempts.userId, userId)),
    getTotalPoints(userId),
  ]);

  const firstEnrollment = enrolledRows[0]?.enrollment;
  let currentLesson = null as null | typeof lessons.$inferSelect;
  if (firstEnrollment?.lastLessonId) {
    const [row] = await db.select().from(lessons).where(eq(lessons.id, firstEnrollment.lastLessonId)).limit(1);
    currentLesson = row ?? null;
  }
  if (!currentLesson && firstEnrollment) {
    const [row] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.courseId, firstEnrollment.courseId), eq(lessons.isPublished, true)))
      .orderBy(asc(lessons.orderIndex))
      .limit(1);
    currentLesson = row ?? null;
  }

  return {
    enrollments: enrolledRows,
    currentLesson,
    stats: {
      totalCourses: enrolledRows.length,
      completedCourses: completedCourses[0]?.value ?? 0,
      lessonsCompleted: completedLessons[0]?.value ?? 0,
      tasksCompleted: completedTasks[0]?.value ?? 0,
      quizPoints: Number(quizTotals[0]?.total ?? 0),
      quizzesCompleted: quizTotals[0]?.count ?? 0,
      totalPoints,
      level: levelFromPoints(totalPoints),
      overallProgress: enrolledRows.length ? Math.round(enrolledRows.reduce((sumValue, row) => sumValue + row.enrollment.progressPercent, 0) / enrolledRows.length) : 0,
    },
  };
}

export async function getLessonLearningData(userId: string, courseId: string, lessonId: string) {
  const outline = await getCourseWithOutline(courseId);
  if (!outline) return null;
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson) return null;
  const [noteRows, progressRows, taskRows, quizRows, bookmarkRows] = await Promise.all([
    db.select().from(notes).where(eq(notes.lessonId, lessonId)),
    db.select().from(lessonProgress).where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId))),
    db.select().from(tasks).where(and(eq(tasks.lessonId, lessonId), eq(tasks.isPublished, true))),
    db.select().from(quizzes).where(and(eq(quizzes.lessonId, lessonId), eq(quizzes.isPublished, true))),
    db.select().from(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.lessonId, lessonId))).limit(1),
  ]);
  const flatLessons = outline.modules.flatMap((module) => module.lessons);
  const currentIndex = flatLessons.findIndex((item) => item.id === lessonId);
  return {
    outline,
    lesson,
    notes: noteRows,
    completedLessonIds: new Set(progressRows.map((row) => row.lessonId)),
    tasks: taskRows,
    quizzes: quizRows,
    isBookmarked: bookmarkRows.length > 0,
    previousLesson: currentIndex > 0 ? flatLessons[currentIndex - 1] : null,
    nextLesson: currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null,
  };
}

export async function getTaskForStudent(taskId: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return task ?? null;
}

export async function getQuizForStudent(quizId: string) {
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  if (!quiz) return null;
  const questionRows = await db.select().from(questions).where(eq(questions.quizId, quizId)).orderBy(asc(questions.orderIndex));
  return { quiz, questions: questionRows };
}

export async function getLeaderboard(limit = 20) {
  const pointRows = await db
    .select({
      userId: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      points: sql<number>`coalesce(sum(${pointsTransactions.points}), 0)`,
      completedCourses: sql<number>`count(distinct ${certificates.courseId})`,
    })
    .from(users)
    .leftJoin(pointsTransactions, eq(pointsTransactions.userId, users.id))
    .leftJoin(certificates, eq(certificates.userId, users.id))
    .where(eq(users.role, "STUDENT"))
    .groupBy(users.id)
    .orderBy(desc(sql`coalesce(sum(${pointsTransactions.points}), 0)`))
    .limit(limit);

  return pointRows.map((row, index) => ({ ...row, rank: index + 1, level: levelFromPoints(Number(row.points ?? 0)) }));
}

export async function getProfileData(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  const [dashboard, badgeRows, certificateRows] = await Promise.all([
    getDashboardData(userId),
    db.select({ badge: badges, userBadge: userBadges }).from(userBadges).innerJoin(badges, eq(badges.id, userBadges.badgeId)).where(eq(userBadges.userId, userId)),
    db.select({ certificate: certificates, course: courses }).from(certificates).innerJoin(courses, eq(courses.id, certificates.courseId)).where(eq(certificates.userId, userId)),
  ]);
  return { user, dashboard, badges: badgeRows, certificates: certificateRows };
}

export async function searchContent(query: string) {
  const q = `%${query}%`;
  const [courseRows, lessonRows, noteRows, taskRows, quizRows] = await Promise.all([
    db.select({ id: courses.id, title: courses.title, description: courses.description, type: sql<string>`'Course'` }).from(courses).where(or(like(courses.title, q), like(courses.description, q))).limit(10),
    db.select({ id: lessons.id, courseId: lessons.courseId, title: lessons.title, description: lessons.description, type: sql<string>`'Lesson'` }).from(lessons).where(or(like(lessons.title, q), like(lessons.description, q))).limit(10),
    db.select({ id: notes.id, lessonId: notes.lessonId, title: notes.title, description: notes.markdown, type: sql<string>`'Note'` }).from(notes).where(or(like(notes.title, q), like(notes.markdown, q))).limit(10),
    db.select({ id: tasks.id, title: tasks.title, description: tasks.description, type: sql<string>`'Task'` }).from(tasks).where(or(like(tasks.title, q), like(tasks.description, q))).limit(10),
    db.select({ id: quizzes.id, title: quizzes.title, description: quizzes.description, type: sql<string>`'Quiz'` }).from(quizzes).where(or(like(quizzes.title, q), like(quizzes.description, q))).limit(10),
  ]);
  return { courses: courseRows, lessons: lessonRows, notes: noteRows, tasks: taskRows, quizzes: quizRows };
}

export async function getAdminAnalytics() {
  await ensureSchema();
  try {
    const [studentCount, courseCount, lessonCount, taskCount, quizCount, enrollmentCount, pointTotal] = await Promise.all([
      db.select({ value: count() }).from(users).where(eq(users.role, "STUDENT")),
      db.select({ value: count() }).from(courses),
      db.select({ value: count() }).from(lessons),
      db.select({ value: count() }).from(tasks),
      db.select({ value: count() }).from(quizzes),
      db.select({ value: count() }).from(enrollments),
      db.select({ total: sum(pointsTransactions.points) }).from(pointsTransactions),
    ]);
    const popularCourses = await db
      .select({ title: courses.title, enrollments: count(enrollments.id) })
      .from(courses)
      .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
      .groupBy(courses.id)
      .orderBy(desc(count(enrollments.id)))
      .limit(5);
    return {
      cards: {
        students: studentCount[0]?.value ?? 0,
        courses: courseCount[0]?.value ?? 0,
        lessons: lessonCount[0]?.value ?? 0,
        tasks: taskCount[0]?.value ?? 0,
        quizzes: quizCount[0]?.value ?? 0,
        enrollments: enrollmentCount[0]?.value ?? 0,
        points: Number(pointTotal[0]?.total ?? 0),
      },
      popularCourses,
    };
  } catch (err) {
    console.warn("[data] getAdminAnalytics notice:", (err as Error).message);
    return {
      cards: {
        students: 0,
        courses: 0,
        lessons: 0,
        tasks: 0,
        quizzes: 0,
        enrollments: 0,
        points: 0,
      },
      popularCourses: [],
    };
  }
}

export async function listStudentsForAdmin() {
  await ensureSchema();
  const studentRows = await db.select().from(users).where(eq(users.role, "STUDENT")).orderBy(desc(users.createdAt));
  const ids = studentRows.map((student) => student.id);
  const totals = ids.length
    ? await db.select({ userId: pointsTransactions.userId, total: sum(pointsTransactions.points) }).from(pointsTransactions).where(inArray(pointsTransactions.userId, ids)).groupBy(pointsTransactions.userId)
    : [];
  return studentRows.map((student) => ({
    ...student,
    totalPoints: Number(totals.find((row) => row.userId === student.id)?.total ?? 0),
  }));
}

export async function updateStudentPermissions(
  studentId: string,
  permissions: {
    notesAccessEnabled?: boolean;
    notesAccessExpiresAt?: Date | null;
    videoAccessEnabled?: boolean;
    videoAccessExpiresAt?: Date | null;
  }
) {
  await ensureSchema();
  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (permissions.notesAccessEnabled !== undefined) {
    updatePayload.notesAccessEnabled = permissions.notesAccessEnabled;
  }
  if (permissions.notesAccessExpiresAt !== undefined) {
    updatePayload.notesAccessExpiresAt = permissions.notesAccessExpiresAt;
  }
  if (permissions.videoAccessEnabled !== undefined) {
    updatePayload.videoAccessEnabled = permissions.videoAccessEnabled;
  }
  if (permissions.videoAccessExpiresAt !== undefined) {
    updatePayload.videoAccessExpiresAt = permissions.videoAccessExpiresAt;
  }

  const [updated] = await db
    .update(users)
    .set(updatePayload)
    .where(eq(users.id, studentId))
    .returning();

  return updated ?? null;
}

export async function updateStudentNotesAccess(studentId: string, enabled: boolean, expiresAt: Date | null) {
  return updateStudentPermissions(studentId, {
    notesAccessEnabled: enabled,
    notesAccessExpiresAt: expiresAt,
  });
}

export async function getStudentDetailForAdmin(studentId: string) {
  await ensureSchema();
  const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
  if (!student) return null;

  const [totalPoints, profileData] = await Promise.all([
    getTotalPoints(studentId),
    getProfileData(studentId),
  ]);

  return {
    student,
    totalPoints,
    profileData,
  };
}

export async function getAllAdminContent() {
  const [courseRows, moduleRows, lessonRows, taskRows, quizRows] = await Promise.all([
    db.select().from(courses).orderBy(desc(courses.createdAt)),
    db.select().from(modules).orderBy(asc(modules.orderIndex)),
    db.select().from(lessons).orderBy(asc(lessons.orderIndex)),
    db.select().from(tasks).orderBy(desc(tasks.createdAt)),
    db.select().from(quizzes).orderBy(desc(quizzes.createdAt)),
  ]);
  return { courses: courseRows, modules: moduleRows, lessons: lessonRows, tasks: taskRows, quizzes: quizRows };
}

export function tablePreviewRows(rows: JsonRow[], limit = 8) {
  const preview = rows.slice(0, limit);
  const columns = Object.keys(preview[0] ?? {});
  return { columns, rows: preview };
}

// In-memory buffer for site visits as fallback / instant cache
type VisitorRecord = {
  id: string;
  path: string;
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
  userId: string | null;
  userRole: string;
  userName: string | null;
  visitedAt: Date;
};
const memoryVisits: VisitorRecord[] = [];

// site_visits table is created by drizzle push from the schema
// No raw SQL needed for SQLite

export async function recordSiteVisit(data: {
  path: string;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  userId?: string | null;
  userRole?: string | null;
  userName?: string | null;
}) {
  const visit: VisitorRecord = {
    id: nanoid(),
    path: data.path,
    ip: data.ip ?? null,
    userAgent: data.userAgent ?? null,
    referer: data.referer ?? null,
    userId: data.userId ?? null,
    userRole: data.userRole ?? "GUEST",
    userName: data.userName ?? null,
    visitedAt: new Date(),
  };

  memoryVisits.unshift(visit);
  if (memoryVisits.length > 200) memoryVisits.pop();

  try {
    await db.insert(siteVisits).values({
      id: visit.id,
      path: visit.path,
      ip: visit.ip,
      userAgent: visit.userAgent,
      referer: visit.referer,
      userId: visit.userId,
      userRole: visit.userRole,
      userName: visit.userName,
      visitedAt: visit.visitedAt,
    });
  } catch (e) {
    // Graceful fallback to memoryVisits
  }
  return visit;
}

export async function getVisitorAnalytics(limit = 50) {
  let dbRows: VisitorRecord[] = [];
  try {
    const rows = await db.select().from(siteVisits).orderBy(desc(siteVisits.visitedAt)).limit(limit);
    dbRows = rows.map((r) => ({
      ...r,
      userRole: r.userRole ?? "GUEST",
    }));
  } catch {
    dbRows = [];
  }

  // Combine DB rows and memory visits deduplicated
  const map = new Map<string, VisitorRecord>();
  memoryVisits.forEach((v) => map.set(v.id, v));
  dbRows.forEach((v) => map.set(v.id, v));
  const allVisits = Array.from(map.values()).sort((a, b) => b.visitedAt.getTime() - a.visitedAt.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const visitsToday = allVisits.filter((v) => new Date(v.visitedAt) >= today);

  const pathCounts: Record<string, number> = {};
  allVisits.forEach((v) => {
    pathCounts[v.path] = (pathCounts[v.path] || 0) + 1;
  });
  const topPages = Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const roleCounts: Record<string, number> = { GUEST: 0, STUDENT: 0, ADMIN: 0 };
  allVisits.forEach((v) => {
    const role = (v.userRole || "GUEST").toUpperCase();
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });

  return {
    totalVisits: Math.max(allVisits.length, memoryVisits.length),
    visitsToday: visitsToday.length,
    guestVisits: roleCounts.GUEST || 0,
    memberVisits: (roleCounts.STUDENT || 0) + (roleCounts.ADMIN || 0),
    topPages,
    recentVisits: allVisits.slice(0, limit),
  };
}

export async function getAllQuizzesForStudent(userId?: string) {
  const quizRows = await db
    .select({
      quiz: quizzes,
      courseTitle: courses.title,
      courseDifficulty: courses.difficulty,
    })
    .from(quizzes)
    .innerJoin(courses, eq(courses.id, quizzes.courseId))
    .where(eq(quizzes.isPublished, true))
    .orderBy(desc(quizzes.createdAt));

  const quizIds = quizRows.map((q) => q.quiz.id);
  const questionCounts = quizIds.length
    ? await db
        .select({ quizId: questions.quizId, count: count() })
        .from(questions)
        .where(inArray(questions.quizId, quizIds))
        .groupBy(questions.quizId)
    : [];

  const userAttempts = userId && quizIds.length
    ? await db
        .select()
        .from(quizAttempts)
        .where(and(eq(quizAttempts.userId, userId), inArray(quizAttempts.quizId, quizIds)))
        .orderBy(desc(quizAttempts.submittedAt))
    : [];

  return quizRows.map(({ quiz, courseTitle, courseDifficulty }) => {
    const qCount = Number(questionCounts.find((qc) => qc.quizId === quiz.id)?.count ?? 0);
    const attempts = userAttempts.filter((a) => a.quizId === quiz.id);
    const bestAttempt = attempts.reduce<typeof quizAttempts.$inferSelect | null>((best, curr) => {
      if (!best) return curr;
      return curr.score > best.score ? curr : best;
    }, null);

    const isPassed = attempts.some((a) => a.passed);
    return {
      ...quiz,
      courseTitle,
      courseDifficulty,
      questionCount: qCount,
      totalAttempts: attempts.length,
      bestScore: bestAttempt?.score ?? null,
      bestPercentage: bestAttempt?.percentage ?? null,
      isPassed,
      lastAttemptAt: attempts[0]?.submittedAt ?? null,
    };
  });
}

export async function getAllQuizzesForAdmin() {
  const [quizRows, courseRows, lessonRows] = await Promise.all([
    db.select().from(quizzes).orderBy(desc(quizzes.createdAt)),
    db.select().from(courses),
    db.select().from(lessons),
  ]);

  const quizIds = quizRows.map((q) => q.id);
  const [questionCounts, attemptRows] = await Promise.all([
    quizIds.length
      ? db
          .select({ quizId: questions.quizId, count: count() })
          .from(questions)
          .where(inArray(questions.quizId, quizIds))
          .groupBy(questions.quizId)
      : Promise.resolve([]),
    quizIds.length
      ? db
          .select({
            attempt: quizAttempts,
            userName: users.name,
            userEmail: users.email,
          })
          .from(quizAttempts)
          .innerJoin(users, eq(users.id, quizAttempts.userId))
          .where(inArray(quizAttempts.quizId, quizIds))
          .orderBy(desc(quizAttempts.submittedAt))
          .limit(100)
      : Promise.resolve([]),
  ]);

  const quizzesWithStats = quizRows.map((quiz) => {
    const course = courseRows.find((c) => c.id === quiz.courseId);
    const lesson = lessonRows.find((l) => l.id === quiz.lessonId);
    const qCount = Number(questionCounts.find((qc) => qc.quizId === quiz.id)?.count ?? 0);
    const attempts = attemptRows.filter((a) => a.attempt.quizId === quiz.id);
    const passedCount = attempts.filter((a) => a.attempt.passed).length;
    const passRate = attempts.length ? Math.round((passedCount / attempts.length) * 100) : 0;

    return {
      ...quiz,
      courseTitle: course?.title ?? "Unknown Course",
      lessonTitle: lesson?.title ?? null,
      questionCount: qCount,
      totalAttempts: attempts.length,
      passRate,
    };
  });

  return {
    quizzes: quizzesWithStats,
    recentAttempts: attemptRows.slice(0, 20),
    totalQuizzes: quizzesWithStats.length,
    totalQuestions: quizzesWithStats.reduce((sum, q) => sum + q.questionCount, 0),
    totalAttempts: attemptRows.length,
  };
}

export async function getDetailedStudentsProgress() {
  const studentUsers = await db.select().from(users).where(eq(users.role, "STUDENT")).orderBy(desc(users.createdAt));
  const studentIds = studentUsers.map((s) => s.id);

  if (!studentIds.length) {
    return {
      students: [],
      metrics: {
        totalStudents: 0,
        averageProgress: 0,
        totalQuizzesTaken: 0,
        overallQuizPassRate: 0,
        totalTasksSolved: 0,
      },
      chartData: {
        courseProgressBars: [],
        quizScoreDistribution: [],
        topPerformers: [],
      },
    };
  }

  const [allEnrollments, allLessonProgress, allTasks, allAttempts, allPoints] = await Promise.all([
    db.select({ enrollment: enrollments, course: courses }).from(enrollments).innerJoin(courses, eq(courses.id, enrollments.courseId)).where(inArray(enrollments.userId, studentIds)),
    db.select().from(lessonProgress).where(inArray(lessonProgress.userId, studentIds)),
    db.select().from(taskSubmissions).where(and(inArray(taskSubmissions.userId, studentIds), eq(taskSubmissions.isCorrect, true))),
    db.select().from(quizAttempts).where(inArray(quizAttempts.userId, studentIds)),
    db.select({ userId: pointsTransactions.userId, total: sum(pointsTransactions.points) }).from(pointsTransactions).where(inArray(pointsTransactions.userId, studentIds)).groupBy(pointsTransactions.userId),
  ]);

  const students = studentUsers.map((student) => {
    const sEnrollments = allEnrollments.filter((e) => e.enrollment.userId === student.id);
    const sLessons = allLessonProgress.filter((l) => l.userId === student.id);
    const sTasks = allTasks.filter((t) => t.userId === student.id);
    const sAttempts = allAttempts.filter((a) => a.userId === student.id);
    const passedAttempts = sAttempts.filter((a) => a.passed);
    const pointsTotal = Number(allPoints.find((p) => p.userId === student.id)?.total ?? 0);
    const avgScore = sAttempts.length ? Math.round(sAttempts.reduce((sum, a) => sum + a.percentage, 0) / sAttempts.length) : 0;
    const avgCourseProgress = sEnrollments.length ? Math.round(sEnrollments.reduce((sum, e) => sum + e.enrollment.progressPercent, 0) / sEnrollments.length) : 0;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      avatarUrl: student.avatarUrl,
      streak: student.streak,
      level: levelFromPoints(pointsTotal),
      points: pointsTotal,
      joinedAt: student.createdAt,
      lastActiveAt: student.lastActiveAt,
      coursesEnrolled: sEnrollments.map((e) => ({
        courseId: e.course.id,
        title: e.course.title,
        progress: e.enrollment.progressPercent,
        completedAt: e.enrollment.completedAt,
      })),
      avgProgress: avgCourseProgress,
      lessonsCompleted: sLessons.length,
      tasksSolved: sTasks.length,
      quizzesAttempted: sAttempts.length,
      quizzesPassed: passedAttempts.length,
      avgQuizScore: avgScore,
      recentAttempts: sAttempts.slice(0, 5),
    };
  });

  const totalProgressSum = students.reduce((sum, s) => sum + s.avgProgress, 0);
  const totalAttemptsCount = allAttempts.length;
  const passedAttemptsCount = allAttempts.filter((a) => a.passed).length;

  // Aggregate course completion distribution
  const courseCounts: Record<string, { title: string; count: number; totalProgress: number }> = {};
  allEnrollments.forEach(({ course, enrollment }) => {
    if (!courseCounts[course.title]) courseCounts[course.title] = { title: course.title, count: 0, totalProgress: 0 };
    courseCounts[course.title].count += 1;
    courseCounts[course.title].totalProgress += enrollment.progressPercent;
  });

  const courseProgressBars = Object.values(courseCounts).map((c) => ({
    title: c.title,
    studentsCount: c.count,
    avgProgress: c.count ? Math.round(c.totalProgress / c.count) : 0,
  }));

  // Quiz score brackets
  const scoreBuckets = [
    { label: "90-100%", count: 0 },
    { label: "70-89%", count: 0 },
    { label: "50-69%", count: 0 },
    { label: "<50%", count: 0 },
  ];
  allAttempts.forEach((a) => {
    if (a.percentage >= 90) scoreBuckets[0].count++;
    else if (a.percentage >= 70) scoreBuckets[1].count++;
    else if (a.percentage >= 50) scoreBuckets[2].count++;
    else scoreBuckets[3].count++;
  });

  return {
    students,
    metrics: {
      totalStudents: students.length,
      averageProgress: students.length ? Math.round(totalProgressSum / students.length) : 0,
      totalQuizzesTaken: totalAttemptsCount,
      overallQuizPassRate: totalAttemptsCount ? Math.round((passedAttemptsCount / totalAttemptsCount) * 100) : 0,
      totalTasksSolved: allTasks.length,
    },
    chartData: {
      courseProgressBars,
      quizScoreDistribution: scoreBuckets,
      topPerformers: [...students].sort((a, b) => b.points - a.points).slice(0, 5),
    },
  };
}

export async function changeUserPassword(userId: string, currentPass: string, newPass: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  if (!verifyPassword(currentPass, user.passwordHash)) {
    throw new Error("Current password is incorrect.");
  }
  if (newPass.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }
  const newHash = hashPassword(newPass);
  await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, userId));
  return true;
}

export async function updateUserProfile(userId: string, data: { name?: string; bio?: string; avatarUrl?: string }) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  const updateData: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  if (data.name && data.name.trim()) updateData.name = data.name.trim();
  if (data.bio !== undefined) updateData.bio = data.bio.trim() || null;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl.trim() || null;
  await db.update(users).set(updateData).where(eq(users.id, userId));
  return true;
}


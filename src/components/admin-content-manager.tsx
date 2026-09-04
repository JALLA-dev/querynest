"use client";

import { useState, type FormEvent } from "react";

type Course = { id: string; title: string };
type Module = { id: string; title: string; courseId: string };
type Lesson = { id: string; title: string; courseId: string; moduleId: string };

async function postJson(url: string, form: HTMLFormElement) {
  const payload = Object.fromEntries(new FormData(form).entries());
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
}

function TextInput({ name, label, placeholder, required = true }: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-700">{label}<input name={name} required={required} placeholder={placeholder} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4" /></label>;
}

function TextArea({ name, label, placeholder, required = true }: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-700">{label}<textarea name={name} required={required} placeholder={placeholder} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4" /></label>;
}

function Select({ name, label, children }: { name: string; label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-700">{label}<select name={name} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4">{children}</select></label>;
}

function ManagedForm({ title, endpoint, children }: { title: string; endpoint: string; children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await postJson(endpoint, event.currentTarget);
      setMessage("Saved successfully. Refreshing content...");
      setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 grid gap-4">{children}</div>
      {message ? <p className="mt-3 text-sm font-bold text-emerald-700">{message}</p> : null}
      <button disabled={loading} className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60" type="submit">{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}

export function AdminContentManager({ courses, modules, lessons }: { courses: Course[]; modules: Module[]; lessons: Lesson[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ManagedForm title="Create course" endpoint="/api/courses">
        <TextInput name="title" label="Course title" placeholder="Advanced SQL Projects" />
        <TextArea name="description" label="Description" placeholder="Describe the course outcome" />
        <TextInput name="instructorName" label="Instructor" placeholder="Querynest Instructor" />
        <TextInput name="difficulty" label="Difficulty" placeholder="Beginner → Advanced" />
        <TextInput name="durationMinutes" label="Duration minutes" placeholder="240" />
      </ManagedForm>

      <ManagedForm title="Create module/chapter" endpoint="/api/modules">
        <Select name="courseId" label="Course">{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select>
        <TextInput name="title" label="Module title" placeholder="Advanced Joins" />
        <TextArea name="description" label="Description" required={false} />
        <TextInput name="orderIndex" label="Order" placeholder="1" />
      </ManagedForm>

      <ManagedForm title="Create video lesson and notes" endpoint="/api/lessons">
        <Select name="courseId" label="Course">{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select>
        <Select name="moduleId" label="Module">{modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</Select>
        <TextInput name="title" label="Lesson title" placeholder="Self Join" />
        <TextArea name="description" label="Video description" />
        <TextInput name="videoUrl" label="Video URL" placeholder="https://www.youtube.com/embed/..." required={false} />
        <TextInput name="durationMinutes" label="Duration minutes" placeholder="12" />
        <TextArea name="notesMarkdown" label="Notes markdown" placeholder="## Self Join\n\n```sql\nSELECT ...\n```" />
      </ManagedForm>

      <ManagedForm title="Create SQL task" endpoint="/api/tasks">
        <Select name="courseId" label="Course">{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select>
        <Select name="lessonId" label="Lesson">{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</Select>
        <TextInput name="title" label="Task title" placeholder="Find all active customers" />
        <TextArea name="description" label="Problem description" />
        <TextInput name="difficulty" label="Difficulty" placeholder="Easy" />
        <TextArea name="dbSchema" label="Database schema" placeholder="employees(id INT, employee_name TEXT, department TEXT, salary INT)" />
        <TextArea name="sampleDataJson" label="Sample data JSON" placeholder='{"tables":{"employees":[{"id":1,"employee_name":"John","department":"IT","salary":72000}]}}' />
        <TextArea name="expectedOutputJson" label="Expected output JSON" placeholder='[{"id":1,"employee_name":"John"}]' />
        <TextArea name="solutionSql" label="Solution SQL" placeholder="SELECT ..." />
        <TextInput name="points" label="Points" placeholder="20" />
      </ManagedForm>

      <ManagedForm title="Create quiz" endpoint="/api/quizzes">
        <Select name="courseId" label="Course">{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select>
        <Select name="lessonId" label="Lesson">{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</Select>
        <TextInput name="title" label="Quiz title" placeholder="JOIN Checkpoint" />
        <TextArea name="description" label="Description" required={false} />
        <TextInput name="question" label="Question" placeholder="Which clause filters rows?" />
        <TextInput name="optionA" label="Option A" placeholder="WHERE" />
        <TextInput name="optionB" label="Option B" placeholder="GROUP BY" />
        <TextInput name="optionC" label="Option C" placeholder="ORDER BY" />
        <TextInput name="optionD" label="Option D" placeholder="HAVING" />
        <TextInput name="correctAnswer" label="Correct answer" placeholder="WHERE" />
        <TextArea name="explanation" label="Explanation" />
        <TextInput name="points" label="Points" placeholder="50" />
      </ManagedForm>
    </div>
  );
}

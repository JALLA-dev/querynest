"use client";

import { useState } from "react";
import { formatVideoEmbedUrl, detectVideoProvider } from "@/lib/video";

type Course = { id: string; title: string };
type Module = { id: string; title: string; courseId: string };
type Lesson = {
  id: string;
  title: string;
  courseId: string;
  moduleId: string;
  videoUrl?: string | null;
  videoProvider?: string | null;
  durationMinutes: number;
  description: string;
};

export function AdminVideoManager({
  courses,
  modules,
  lessons,
}: {
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
}) {
  const [activeTab, setActiveTab] = useState<"edit" | "create">("edit");
  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessons[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");

  // Form states for existing lesson
  const currentLesson = lessons.find((l) => l.id === selectedLessonId);
  const [videoUrl, setVideoUrl] = useState(currentLesson?.videoUrl || "");
  const [durationMinutes, setDurationMinutes] = useState(currentLesson?.durationMinutes || 10);
  const [lessonTitle, setLessonTitle] = useState(currentLesson?.title || "");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states for new video lesson
  const [newCourseId, setNewCourseId] = useState(courses[0]?.id || "");
  const [newModuleId, setNewModuleId] = useState(
    modules.find((m) => m.courseId === (courses[0]?.id || ""))?.id || modules[0]?.id || ""
  );
  const [newTitle, setNewTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newDuration, setNewDuration] = useState(15);
  const [newDescription, setNewDescription] = useState("");

  const filteredNewModules = modules.filter((m) => m.courseId === newCourseId);

  // When selected lesson changes, update form
  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLessonId(lesson.id);
    setVideoUrl(lesson.videoUrl || "");
    setDurationMinutes(lesson.durationMinutes || 10);
    setLessonTitle(lesson.title);
    setMessage(null);
  };

  const previewUrl = formatVideoEmbedUrl(activeTab === "edit" ? videoUrl : newVideoUrl);
  const currentProvider = detectVideoProvider(activeTab === "edit" ? videoUrl : newVideoUrl);

  const handleSaveExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: selectedLessonId,
          title: lessonTitle,
          videoUrl,
          durationMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save video.");

      setMessage({ text: "Video saved successfully! Refreshing...", type: "success" });
      setTimeout(() => window.location.reload(), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving video";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseId || !newModuleId || !newTitle.trim()) {
      setMessage({ text: "Please fill in course, module, and lesson title.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: newCourseId,
          moduleId: newModuleId,
          title: newTitle,
          videoUrl: newVideoUrl,
          durationMinutes: newDuration,
          description: newDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create video lesson.");

      setMessage({ text: "New video lesson created successfully! Refreshing...", type: "success" });
      setTimeout(() => window.location.reload(), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating video lesson";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (!selectedLessonId) return;
    if (!confirm("Are you sure you want to remove the video from this lesson?")) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/videos?lessonId=${selectedLessonId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove video.");

      setVideoUrl("");
      setMessage({ text: "Video removed from lesson. Refreshing...", type: "success" });
      setTimeout(() => window.location.reload(), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error removing video";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter((l) => {
    const matchQuery = l.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCourse = courseFilter === "ALL" || l.courseId === courseFilter;
    return matchQuery && matchCourse;
  });

  return (
    <div className="grid gap-8">
      {/* Tab Selector */}
      <div className="flex gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => { setActiveTab("edit"); setMessage(null); }}
          className={`rounded-2xl px-5 py-2.5 text-sm font-black transition ${
            activeTab === "edit"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          🎬 Add / Edit Video on Lesson
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("create"); setMessage(null); }}
          className={`rounded-2xl px-5 py-2.5 text-sm font-black transition ${
            activeTab === "create"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          ➕ Create New Video Lesson
        </button>
      </div>

      {message ? (
        <div
          className={`rounded-2xl p-4 text-sm font-bold ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "border border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {/* Main Grid: Form + Live Preview */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Form */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {activeTab === "edit" ? (
            <form onSubmit={handleSaveExisting} className="grid gap-5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Attach or Update Video
              </h2>

              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                Target Lesson
                <select
                  value={selectedLessonId}
                  onChange={(e) => {
                    const l = lessons.find((item) => item.id === e.target.value);
                    if (l) handleSelectLesson(l);
                  }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.videoUrl ? "🎬 " : "⚠️ (No video) "} {l.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                Lesson Title
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                Video URL (YouTube, Vimeo, Loom, or Direct MP4)
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=7S_tz1z_5bA or youtu.be/..."
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-xs font-normal text-slate-500">
                  Tip: Regular YouTube URLs are automatically converted into responsive embedded players.
                </span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  Duration (Minutes)
                  <input
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </label>

                <div className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  Detected Provider
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black capitalize text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    {currentProvider}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Video to Lesson"}
                </button>
                {currentLesson?.videoUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    disabled={loading}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-black text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    Remove Video
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateNew} className="grid gap-5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Create New Video Lesson
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  Course
                  <select
                    value={newCourseId}
                    onChange={(e) => {
                      setNewCourseId(e.target.value);
                      const mod = modules.find((m) => m.courseId === e.target.value);
                      if (mod) setNewModuleId(mod.id);
                    }}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  Module / Chapter
                  <select
                    value={newModuleId}
                    onChange={(e) => setNewModuleId(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    {filteredNewModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                Lesson Title
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master SQL Aggregations & GROUP BY"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                Video URL
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  Duration (Minutes)
                  <input
                    type="number"
                    min="1"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </label>

                <div className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  Detected Provider
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black capitalize text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    {currentProvider}
                  </div>
                </div>
              </div>

              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                Lesson Description
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What will the student learn in this video lesson?"
                  className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Video Lesson"}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Live Video Player Preview */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              📺 Live Video Preview
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              This preview shows how students will see the video in their learning room.
            </p>

            <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-slate-950">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  title="Video Preview"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="grid h-full place-items-center p-6 text-center text-sm font-medium text-slate-400">
                  Enter a valid video URL above to see the live player preview.
                </div>
              )}
            </div>

            {previewUrl ? (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <span className="font-bold">Embed URL:</span>
                <span className="truncate max-w-[240px] text-slate-500">{previewUrl}</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Supported Video Platforms</h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>• <strong>YouTube</strong>: regular links, youtu.be shortlinks, or embed links</li>
              <li>• <strong>Vimeo</strong>: standard video URLs (e.g. vimeo.com/123456)</li>
              <li>• <strong>Loom</strong>: share links (loom.com/share/...)</li>
              <li>• <strong>Direct MP4/WebM</strong>: direct links to video files</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Catalog: Existing Lessons & Video Status */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">All Lessons & Video Status</h3>
            <p className="mt-1 text-sm text-slate-500">
              Click any lesson to edit or attach a video to it.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Courses ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-xs outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {filteredLessons.map((l) => {
            const isSelected = l.id === selectedLessonId;
            const course = courses.find((c) => c.id === l.courseId);
            return (
              <div
                key={l.id}
                onClick={() => {
                  setActiveTab("edit");
                  handleSelectLesson(l);
                }}
                className={`flex cursor-pointer items-center justify-between p-4 transition ${
                  isSelected
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{l.videoUrl ? "🎬" : "📄"}</span>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">{l.title}</h4>
                    <p className="text-xs text-slate-500">
                      {course?.title || "SQL Course"} • {l.durationMinutes} mins
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {l.videoUrl ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Has Video
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      No Video
                    </span>
                  )}
                  <button
                    type="button"
                    className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
          {filteredLessons.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No lessons match your search query.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

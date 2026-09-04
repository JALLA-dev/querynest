import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { VisitorTracker } from "@/components/visitor-tracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Querynest — Learn SQL by Doing",
  description: "A modern SQL learning platform with courses, video lessons, notes, quizzes, practice tasks, points, progress, and leaderboards.",
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{themeScript}</Script>
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}


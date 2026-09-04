"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Send tracking ping silently
    try {
      fetch("/api/track-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          referer: typeof document !== "undefined" ? document.referrer : "",
        }),
      }).catch(() => {
        // Silent error prevention for client analytics
      });
    } catch {
      // Ignore background errors
    }
  }, [pathname]);

  return null;
}

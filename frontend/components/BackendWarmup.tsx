"use client";

import { useEffect } from "react";

/** Best-effort ping so Render is less likely to hibernate on the first real chart. */
export default function BackendWarmup() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("astro_be_warm") === "1") return;
      sessionStorage.setItem("astro_be_warm", "1");
    } catch {
      /* private mode */
    }
    fetch("/api/health", { cache: "no-store" }).catch(() => {
      /* cold start is handled on the real request */
    });
  }, []);
  return null;
}

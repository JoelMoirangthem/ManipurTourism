"use client";
import { useEffect } from "react";
import { requestPanelOpen, seedPlanStarter } from "@/components/assistant-thread";

export function AssistantAutoOpen() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("assistant") !== "open") return;
    const ask = params.get("ask");
    const start = params.get("start");
    if (start === "plan") seedPlanStarter();
    requestPanelOpen(ask);
    params.delete("assistant");
    params.delete("ask");
    params.delete("start");
    const clean = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (clean ? `?${clean}` : ""));
  }, []);
  return null;
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Run } from "@/types/run";

export function useRuns(userId: string) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("runs")
      .select("*, profiles:user_id(username, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) console.log("runs error:", error);
    setRuns(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  async function deleteRun(runId: string) {
    const { error } = await supabase.from("runs").delete().eq("id", runId);
    if (error) {
      console.log("delete run error:", error);
      return false;
    }
    setRuns((prev) => prev.filter((r) => r.id !== runId));
    return true;
  }

  async function updateRun(
    runId: string,
    updates: { title?: string; photo_url?: string },
  ) {
    const { error } = await supabase
      .from("runs")
      .update(updates)
      .eq("id", runId);
    if (error) {
      console.log("update run error:", error);
      return false;
    }
    setRuns((prev) =>
      prev.map((r) => (r.id === runId ? { ...r, ...updates } : r)),
    );
    return true;
  }

  return { runs, loading, deleteRun, updateRun, refetch: fetchRuns };
}

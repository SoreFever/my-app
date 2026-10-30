import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Run } from "@/types/run";

export function useRuns(userId: string) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoading(true);

    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    if (followsError) console.log(followsError);

    const ids = [userId, ...(follows ?? []).map((f) => f.following_id)];

    const { data, error } = await supabase
      .from("runs")
      .select(
        `
      *,
      profiles:user_id(username, avatar_url),
      likes(count)
    `,
      )
      .in("user_id", ids)
      .order("created_at", { ascending: false });
    if (error) console.log(error);

    setRuns(
      (data ?? []).map((r) => ({ ...r, likeCount: r.likes?.[0]?.count ?? 0 })),
    );
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

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Run } from "@/types/run";

export function useRuns(userId: string) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRuns() {
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
  }

  useEffect(() => {
    fetchRuns();
  }, [userId]);

  async function deleteRun(runId: string) {
    const { error } = await supabase.from("runs").delete().eq("id", runId);
    if (error) {
      console.log("delete run error:", error);
      return false;
    }

    setRuns((prevRuns) => prevRuns.filter((run) => run.id !== runId));
    return true;
  }

  return { runs, loading, deleteRun, refetch: fetchRuns };
}

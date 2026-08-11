import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Run } from "@/types/run";

export function useRuns(userId: string) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    supabase
      .from("runs")
      .select("*, profiles:user_id(username, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.log("runs error", error);
        setRuns(data ?? []);
        setLoading(false);
      });
  }, [userId]);

  return { runs, loading };
}

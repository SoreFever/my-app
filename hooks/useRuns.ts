import { supabase } from "@/lib/supabase";
import { Run } from "@/types/run";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useRuns(userId: string) {
  const qc = useQueryClient();
  const queryKey = ["runs", userId];
  const {
    data: runs = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<Run[]> => {
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);
      if (followsError) throw followsError;

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
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        likeCount: r.likes?.[0]?.count ?? 0,
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (runId: string) => {
      const { error } = await supabase.from("runs").delete().eq("id", runId);

      if (error) throw error;
    },
    onMutate: async (runId) => {
      await qc.cancelQueries({ queryKey: queryKey });

      const prevRuns = qc.getQueryData<Run[]>(queryKey);

      qc.setQueryData<Run[]>(queryKey, (old = []) =>
        old.filter((r) => r.id !== runId),
      );
      return { prevRuns };
    },
    onError: (_error, _runId, ctx) => {
      qc.setQueryData(queryKey, ctx?.prevRuns);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      runId,
      updates,
    }: {
      runId: string;
      updates: { title?: string; photo_url?: string };
    }) => {
      const { error } = await supabase
        .from("runs")
        .update(updates)
        .eq("id", runId);
      if (error) throw error;
    },
    onMutate: async ({ runId, updates }) => {
      await qc.cancelQueries({ queryKey });

      const prevRuns = qc.getQueryData<Run[]>(queryKey);

      qc.setQueryData<Run[]>(queryKey, (old = []) =>
        old.map((r) => (r.id === runId ? { ...r, ...updates } : r)),
      );
      return { prevRuns };
    },
    onError: (_error, _vars, ctx) => {
      qc.setQueryData(queryKey, ctx?.prevRuns);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  return {
    runs,
    loading: isLoading,
    deleteRun: deleteMutation.mutateAsync,
    updateRun: (
      runId: string,
      updates: { title?: string; photo_url?: string },
    ) => updateMutation.mutateAsync({ runId, updates }),
    refetch,
  };
}

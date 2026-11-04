import { FlashList } from "@shopify/flash-list";
import { RunCard } from "@/components/RunCard";
import { useRuns } from "@/hooks/useRuns";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TouchableOpacity, ActivityIndicator } from "react-native";
import {  useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { runs, loading, deleteRun } = useRuns(userId ?? "");
  const router = useRouter();

  const mutedColor = useThemeColor({}, "muted");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  const qc = useQueryClient();

  const { data: likes = [] } = useQuery({
    queryKey: ["likes", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("likes")
        .select("run_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
  });

  const likeIds = useMemo(() => new Set(likes.map((l) => l.run_id)), [likes]);

  const likeMutation = useMutation({
    mutationFn: async ({ runId, liked }: { runId: string; liked: boolean }) => {
      const { error } = liked
        ? await supabase
            .from("likes")
            .delete()
            .eq("user_id", userId)
            .eq("run_id", runId)
        : await supabase
            .from("likes")
            .insert({ user_id: userId, run_id: runId });
      if (error) throw error;
    },
    onMutate: async ({ runId, liked }) => {
      await qc.cancelQueries({ queryKey: ["likes", userId] });
      await qc.cancelQueries({ queryKey: ["likeCount", runId] });

      const prevLikes = qc.getQueryData(["likes", userId]);
      const prevCount = qc.getQueryData(["likeCount", runId]);

      qc.setQueryData(["likes", userId], (old: { run_id: string }[] = []) =>
        liked
          ? old.filter((l) => l.run_id !== runId)
          : [...old, { run_id: runId }],
      );
      qc.setQueryData(
        ["likeCount", runId],
        (old: number = 0) => old + (liked ? -1 : 1),
      );
      return { prevLikes, prevCount };
    },

    onError: (_e, { runId }, ctx) => {
      qc.setQueryData(["likes", userId], ctx?.prevLikes);
      qc.setQueryData(["likeCount", runId], ctx?.prevCount);
    },

    onSettled: (_d, _e, { runId }) => {
      qc.invalidateQueries({ queryKey: ["likes", userId] });
      qc.invalidateQueries({ queryKey: ["likeCount", runId] });
    },
  });

  function toggleLike(runId: string) {
    if (!userId) return;
    likeMutation.mutate({ runId, liked: likeIds.has(runId) });
  }

  if (loading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (runs.length === 0) {
    return (
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Ionicons name="footsteps-outline" size={48} color={mutedColor} />
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          No runs yet
        </ThemedText>
        <ThemedText
          style={{ color: mutedColor, textAlign: "center", marginBottom: 20 }}
        >
          Start tracking to see your activity feed here.
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/record")}
          style={{
            backgroundColor: tintColor,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 20,
          }}
        >
          <ThemedText style={{ color: backgroundColor, fontWeight: "600" }}>
            Record a run
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }
  return (
    <FlashList
      data={runs}
      renderItem={({ item }) => (
        <RunCard
          run={item}
          onDelete={deleteRun}
          liked={likeIds.has(item.id)}
          onLike={toggleLike}
          isOwner={item.user_id === userId}
        />
      )}
      contentContainerStyle={{ padding: 12 }}
    />
  );
}

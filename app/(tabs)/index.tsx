import { FlashList } from "@shopify/flash-list"
import { mockRuns } from "@/data/mockRuns";
import { RunCard } from "@/components/RunCard";
import { useRuns } from "@/hooks/useRuns";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ActivityIndicator, View } from "react-native";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null)

  

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })
  }, [])

  const { runs, loading } = useRuns(userId ?? '')

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }
  return (
    <FlashList
      data={runs}
      renderItem={({ item }) => <RunCard run={item} />}
      contentContainerStyle={{ padding: 12 }}
    />
  );
}

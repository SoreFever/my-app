import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { supabase } from "@/lib/supabase";
import { SimpleLineIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";

type User = {
  id: string;
  username: string;
};

export default function Following() {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const mutedColor = useThemeColor({}, "muted");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    console.log(userId);

    (async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("profiles!follows_following_id_fkey(id, username)")
        .eq("follower_id", userId);

      if (error) console.error(error.message);

      setUsers((data ?? []).map((r: any) => r.profiles));
    })();
  }, [userId]);


  return (
    <ThemedView style={styles.container}>
      <ThemedView style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <TouchableOpacity onPress={() => router.push("/follow/follow-search")}>
          <SimpleLineIcons name="user-follow" size={24} color={mutedColor} />
        </TouchableOpacity>
      </ThemedView>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>No users found</ThemedText>
        }
        renderItem={({ item }) => {
          return (
            <ThemedView style={styles.row}>
              <ThemedText style={styles.name}>{item.username}</ThemedText>
            </ThemedView>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  name: { fontSize: 16 },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonFollowing: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonTextFollowing: { color: "#007AFF" },
  empty: { textAlign: "center", marginTop: 20, color: "#888" },
});

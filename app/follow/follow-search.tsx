import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

type User = {
  id: string;
  username: string;
};

export default function FollowSearch() {
  const [query, setQuery] = useState("");
  const [following, setFollowing] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const [usersResp, followsResp] = await Promise.all([
        supabase.from("profiles").select("id, username").neq("id", userId),
        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId),
      ]);

      if (usersResp.error) console.error(usersResp.error.message);
      else setUsers(usersResp.data ?? []);

      if (followsResp.error) console.error(followsResp.error.message);
      else setFollowing((followsResp.data ?? []).map((r) => r.following_id));
    })();
  }, [userId]);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase()),
  );

  const toggleFollow = async (id: string) => {
    if (!userId) return;
    const isFollowing = following.includes(id);

    setFollowing((prev) =>
      isFollowing ? prev.filter((f) => f !== id) : [...prev, id],
    );

    const { error } = isFollowing
      ? await supabase
          .from("follows")
          .delete()
          .eq("follower_id", userId)
          .eq("following_id", id)
      : await supabase
          .from("follows")
          .insert({ follower_id: userId, following_id: id });

    if (error && error.code !== "23505") {
      console.error(error.message);
      setFollowing((prev) =>
        isFollowing ? [...prev, id] : prev.filter((f) => f !== id),
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search users..."
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>No users found</ThemedText>
        }
        renderItem={({ item }) => {
          const isFollowing = following.includes(item.id);
          return (
            <ThemedView style={styles.row}>
              <ThemedText style={styles.name}>{item.username}</ThemedText>
              <TouchableOpacity
                style={[styles.button, isFollowing && styles.buttonFollowing]}
                onPress={() => toggleFollow(item.id)}
              >
                <ThemedText
                  style={[
                    styles.buttonText,
                    isFollowing && styles.buttonTextFollowing,
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </ThemedText>
              </TouchableOpacity>
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

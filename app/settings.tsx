import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Alert, TextInput, TouchableOpacity } from "react-native";
import Avatar from "@/components/Avatar";
import { appStyles } from "@/constants/styles";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function Settings() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const styles = appStyles;
  const cardColor = useThemeColor({}, 'card')
  const borderColor = useThemeColor({}, 'border')
  const mutedColor = useThemeColor({}, 'muted')

  // NEW: fetch the session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email);
    });
  }, []);

  useEffect(() => {
    if (userId) getProfile();
  }, [userId]);

  async function getProfile() {
    try {
      setLoading(true);
      let { data, error, status } = await supabase
        .from("profiles")
        .select(`username, website, avatar_url`)
        .eq("id", userId)
        .single();
      if (error && status !== 406) {
        throw error;
      }
      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }
  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string;
  }) {
    try {
      setLoading(true);
      const updates = {
        id: userId,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };
      let { error } = await supabase.from("profiles").upsert(updates);
      if (error) {
        throw error;
      }
    } catch (error: any) {
      Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <ThemedView style={styles.container}>
      <ThemedView>
        <Avatar
          size={150}
          url={avatarUrl}
          onUpload={(path: string) => {
            const { data } = supabase.storage
              .from("avatars")
              .getPublicUrl(path);
            setAvatarUrl(data.publicUrl);
            updateProfile({ username, website, avatar_url: data.publicUrl });
          }}
        />
      </ThemedView>
      <ThemedView style={[styles.verticallySpaced, styles.mt20]}>
        <ThemedText style={styles.label}>Email</ThemedText>
        <TextInput
          value={email ?? ""}
          editable={false}
          selectTextOnFocus={false}
          style={[styles.input, styles.inputDisabled, {backgroundColor: cardColor, borderColor, color: mutedColor}]}
        />
      </ThemedView>
      <ThemedView style={styles.verticallySpaced}>
        <ThemedText style={styles.label}>Username</ThemedText>
        <TextInput
          value={username || ""}
          onChangeText={(text) => setUsername(text)}
          style={styles.input}
        />
      </ThemedView>
      <ThemedView style={styles.verticallySpaced}>
        <ThemedText style={styles.label}>Website</ThemedText>
        <TextInput
          value={website || ""}
          onChangeText={(text) => setWebsite(text)}
          style={styles.input}
        />
      </ThemedView>
      <ThemedView style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() =>
            updateProfile({ username, website, avatar_url: avatarUrl })
          }
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? "Loading ..." : "Update"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <ThemedView style={styles.verticallySpaced}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => supabase.auth.signOut()}
        >
          <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

import { useEffect, useState } from "react";
import { TextInput, TouchableOpacity, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { appStyles } from "@/constants/styles";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ChangeUsername() {
  const [userId, setUserId] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const styles = appStyles;

  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor({}, "muted");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  async function updateUsername() {
    if (!newUsername) {
      Alert.alert("Enter a new username address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: newUsername })
      .eq("id", userId);
    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }
  }

  return (
    <ThemedView style={[styles.container, { flex: 1, marginTop: 0 }]}>
      <ThemedText style={[styles.label, { color: mutedColor }]}>
        New Username
      </ThemedText>
      <TextInput
        value={newUsername}
        onChangeText={setNewUsername}
        placeholder="newUsername"
        placeholderTextColor={mutedColor}
        autoCapitalize="none"
        keyboardType="default"
        style={[styles.input, { color: textColor, borderColor }]}
      />
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: tintColor, marginTop: 20 },
          loading && styles.buttonDisabled,
        ]}
        onPress={updateUsername}
        disabled={loading}
      >
        <ThemedText style={[styles.buttonText, { color: backgroundColor }]}>
          {loading ? "Updating..." : "Update Username"}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

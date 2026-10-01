import { useState } from "react";
import { TextInput, TouchableOpacity, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { appStyles } from "@/constants/styles";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ChangeEmail() {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const styles = appStyles;

  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor({}, "muted");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  async function updateEmail() {
    if (!newEmail) {
      Alert.alert("Enter a new email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }
    Alert.alert(
      "Confirm your change",
      "Check both your old and new email inboxes for confirmation links.",
    );
  }

  return (
    <ThemedView style={[styles.container, { flex: 1, marginTop: 0 }]}>
      <ThemedText style={[styles.label, { color: mutedColor }]}>
        New Email
      </ThemedText>
      <TextInput
        value={newEmail}
        onChangeText={setNewEmail}
        placeholder="new@email.com"
        placeholderTextColor={mutedColor}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { color: textColor, borderColor }]}
      />
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: tintColor, marginTop: 20 },
          loading && styles.buttonDisabled,
        ]}
        onPress={updateEmail}
        disabled={loading}
      >
        <ThemedText style={[styles.buttonText, { color: backgroundColor }]}>
          {loading ? "Updating..." : "Update Email"}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

import { useState } from "react";
import { TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { appStyles } from "@/constants/styles";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ChangePassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const styles = appStyles;

  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor({}, "muted");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  async function updatePassword() {
    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }
    Alert.alert("Password updated");
    router.back();
  }

  return (
    <ThemedView style={[styles.container, { flex: 1, marginTop: 0 }]}>
      <ThemedText style={[styles.label, { color: mutedColor }]}>
        New Password
      </ThemedText>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, { color: textColor, borderColor }]}
      />
      <ThemedText style={[styles.label, { color: mutedColor, marginTop: 12 }]}>
        Confirm Password
      </ThemedText>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, { color: textColor, borderColor }]}
      />
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: tintColor, marginTop: 20 },
          loading && styles.buttonDisabled,
        ]}
        onPress={updatePassword}
        disabled={loading}
      >
        <ThemedText style={[styles.buttonText, { color: backgroundColor }]}>
          {loading ? "Updating..." : "Update Password"}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

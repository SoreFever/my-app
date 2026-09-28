import { useState } from "react";
import { TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { appStyles } from "@/constants/styles";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ResetPassword() {
  const router = useRouter();
  const styles = appStyles;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

    Alert.alert(
      "Password updated",
      "You can now sign in with your new password.",
    );
    router.replace("/auth");
  }

  return (
    <ThemedView style={[styles.container, {flex: 1}]}>
      <ThemedView style={[styles.verticallySpaced, styles.mt20]}>
        <ThemedText style={[styles.label, { color: mutedColor }]}>
          New Password
        </ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="New password"
          placeholderTextColor={mutedColor}
          autoCapitalize="none"
          style={[styles.input, { color: textColor, borderColor }]}
        />
      </ThemedView>

      <ThemedView style={styles.verticallySpaced}>
        <ThemedText style={[styles.label, { color: mutedColor }]}>
          Confirm Password
        </ThemedText>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Confirm password"
          placeholderTextColor={mutedColor}
          autoCapitalize="none"
          style={[styles.input, { color: textColor, borderColor }]}
        />
      </ThemedView>

      <ThemedView style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: tintColor },
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
    </ThemedView>
  );
}

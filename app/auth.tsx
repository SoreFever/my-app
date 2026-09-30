import { useState } from "react";
import { Alert, TextInput, TouchableOpacity } from "react-native";
import { supabase } from "@/lib/supabase";
import { appStyles } from "@/constants/styles";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import * as Linking from "expo-linking";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const styles = appStyles;

  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor({}, "muted");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  async function signInWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function resetPassword() {
    if (!email) {
      Alert.alert("Please enter your email first.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://reset-password-ecru.vercel.app/',
    });
    if (error) Alert.alert(error.message);
    else Alert.alert("Check your email for a password reset link.");
    setLoading(false);
  }

  return (
    <ThemedView style={[styles.container, {flex: 1}]}>
      <ThemedView style={[styles.verticallySpaced, styles.mt20]}>
        <ThemedText style={[styles.label, { color: mutedColor }]}>
          Email
        </ThemedText>
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor={mutedColor}
          autoCapitalize="none"
          style={[styles.input, { color: textColor, borderColor }]}
        />
      </ThemedView>
      <ThemedView style={styles.verticallySpaced}>
        <ThemedText style={[styles.label, { color: mutedColor }]}>
          Password
        </ThemedText>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
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
          onPress={() => signInWithEmail()}
          disabled={loading}
        >
          <ThemedText style={[styles.buttonText, { color: backgroundColor }]}>
            Sign in
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <ThemedView style={styles.verticallySpaced}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => signUpWithEmail()}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Sign up</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <TouchableOpacity onPress={resetPassword} disabled={loading}>
        <ThemedText
          style={{ color: tintColor, textAlign: "center", marginTop: 8 }}
        >
          Forgot password?
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

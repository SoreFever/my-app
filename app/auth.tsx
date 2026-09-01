import React, { useState } from "react";
import { Alert, TextInput, TouchableOpacity} from "react-native";
import { supabase } from "@/lib/supabase";
import { appStyles } from "@/constants/styles";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

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
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.verticallySpaced, styles.mt20]}>
        <ThemedText style={[styles.label, {color: mutedColor}]}>Email</ThemedText>
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor={mutedColor}
          autoCapitalize="none"
          style={[styles.input, {color: textColor, borderColor}]}
        />
      </ThemedView>
      <ThemedView style={styles.verticallySpaced}>
        <ThemedText style={[styles.label, {color: mutedColor}]}>Password</ThemedText>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          placeholderTextColor={mutedColor}
          autoCapitalize="none"
          style={[styles.input, {color: textColor, borderColor}]}
        />
      </ThemedView>
      <ThemedView style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, {backgroundColor: tintColor}, loading && styles.buttonDisabled]}
          onPress={() => signInWithEmail()}
          disabled={loading}
        >
          <ThemedText style={[styles.buttonText, {color: backgroundColor}]}>Sign in</ThemedText>
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
    </ThemedView>
  );
}

import { TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

function SettingsRow({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const borderColor = useThemeColor({}, "border");
  const mutedColor = useThemeColor({}, "muted");
  const textColor = useThemeColor({}, "text");

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? "#e74c3c" : textColor}
        style={{ width: 28 }}
      />
      <ThemedText
        style={{
          fontSize: 16,
          color: destructive ? "#e74c3c" : textColor,
          flex: 1,
        }}
      >
        {label}
      </ThemedText>
      <Ionicons name="chevron-forward" size={18} color={mutedColor} />
    </TouchableOpacity>
  );
}

export default function Settings() {
  const router = useRouter();

  function confirmSignOut() {
    Alert.alert("Sign out?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  }

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <ThemedText style={{ fontSize: 13, fontWeight: "600", marginBottom: 4 }}>
        ACCOUNT
      </ThemedText>
      <SettingsRow
        icon="person-outline"
        label="Change Username"
        onPress={() => router.push("/change-username")}
      />
      <SettingsRow
        icon="mail-outline"
        label="Change Email"
        onPress={() => router.push("/change-email")}
      />
      <SettingsRow
        icon="lock-closed-outline"
        label="Change Password"
        onPress={() => router.push("/change-password")}
      />

      <ThemedText
        style={{
          fontSize: 13,
          fontWeight: "600",
          marginTop: 24,
          marginBottom: 4,
        }}
      >
        ABOUT
      </ThemedText>
      <SettingsRow
        icon="information-circle-outline"
        label="App Version"
        onPress={() => Alert.alert("RunTracker", "v1.0.0")}
      />

      <ThemedView style={{ marginTop: 24 }}>
        <SettingsRow
          icon="log-out-outline"
          label="Sign Out"
          onPress={confirmSignOut}
          destructive
        />
      </ThemedView>
    </ThemedView>
  );
}

import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { markRunsDirty } from "@/lib/runsSignal";

export default function EditRun() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");

  useEffect(() => {
    if (!id) return;
    supabase
      .from("runs")
      .select("title, photo_url")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) console.log("load run error:", error);
        if (data) {
          setTitle(data.title ?? "");
          setPhotoUrl(data.photo_url);
        }
        setLoading(false);
      });
  }, [id]);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const image = result.assets[0];
    const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
    const fileExt = image.uri.split(".").pop()?.toLowerCase() ?? "jpeg";
    const path = `${Date.now()}.${fileExt}`;

    const { data, error: uploadError } = await supabase.storage
      .from("run_photos")
      .upload(path, arraybuffer, {
        contentType: image.mimeType ?? "image/jpeg",
      });

    if (uploadError) {
      Alert.alert("Upload failed", uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("run_photos")
      .getPublicUrl(data.path);
    setPhotoUrl(urlData.publicUrl);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("runs")
      .update({ title, photo_url: photoUrl })
      .eq("id", id);
    setSaving(false);

    if (error) {
      Alert.alert("Save failed", error.message);
      return;
    }

    markRunsDirty();
    router.back();
  }

  if (loading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <TouchableOpacity onPress={pickPhoto}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{ width: "100%", height: 200, borderRadius: 12 }}
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              backgroundColor: borderColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ThemedText>Add a photo</ThemedText>
          </View>
        )}
      </TouchableOpacity>

      <ThemedText style={{ marginTop: 16, marginBottom: 4 }}>Title</ThemedText>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Run title"
        style={{
          borderWidth: 1,
          borderColor,
          borderRadius: 8,
          padding: 12,
          color: textColor,
        }}
      />

      <TouchableOpacity
        onPress={save}
        disabled={saving}
        style={{
          backgroundColor: tintColor,
          borderRadius: 12,
          padding: 16,
          alignItems: "center",
          marginTop: 24,
        }}
      >
        <ThemedText style={{ color: backgroundColor, fontWeight: "600" }}>
          {saving ? "Saving..." : "Save"}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

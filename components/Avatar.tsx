import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { View, Alert, Image, Text, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { appStyles } from "@/constants/styles";
import { useThemeColor } from "@/hooks/use-theme-color";

interface Props {
  size: number;
  url: string | null;
  onUpload: (filePath: string) => void;
}

export default function Avatar({ url, size = 150, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const avatarSize = { height: size, width: size, borderRadius: size / 2 };
  const styles = appStyles;

  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");

  async function uploadAvatar() {
    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // Restrict to only images
        allowsMultipleSelection: false, // Can only select one image
        allowsEditing: true, // Allows the user to crop / rotate their photo before uploading it
        quality: 1,
        exif: false, // We don't want nor need that data.
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("User cancelled image picker.");
        return;
      }

      const image = result.assets[0];
      console.log("Got image", image);

      if (!image.uri) {
        throw new Error("No image uri!"); // Realistically, this should never happen, but just in case...
      }

      const arraybuffer = await fetch(image.uri).then((res) =>
        res.arrayBuffer(),
      );

      const fileExt = image.uri?.split(".").pop()?.toLowerCase() ?? "jpeg";
      const path = `${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? "image/jpeg",
        });

      if (uploadError) {
        throw uploadError;
      }

      onUpload(data.path);
    } catch (error: any) {
      if (error) {
        Alert.alert(error.message);
      } else {
        throw error;
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.avatarContainer}>
      {url ? (
        <Image
          source={{ uri: url }}
          accessibilityLabel="Avatar"
          style={[avatarSize, styles.avatar, styles.image]}
        />
      ) : (
        <View
          style={[
            avatarSize,
            styles.avatar,
            styles.noImage,
            { backgroundColor: cardColor, borderColor },
          ]}
        />
      )}
      <View>
        <TouchableOpacity
          style={[styles.button, uploading && styles.buttonDisabled]}
          onPress={uploadAvatar}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {uploading ? "Uploading ..." : "Upload"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

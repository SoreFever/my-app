import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function Record() {
  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <ThemedText style={{ fontSize: 20, fontWeight: "600" }}>
        Record a Run
      </ThemedText>
    </ThemedView>
  );
}

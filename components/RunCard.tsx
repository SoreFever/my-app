import { Run } from "@/types/run"
import { View, Text, Image, StyleSheet } from "react-native"

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function RunCard({ run }: { run: Run }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{run.title}</Text>

      <Image source={{ uri: run.photo_url }} style={styles.photo} />

      <View style={styles.statsRow}>
        <Text style={styles.stat}>{run.distance_km} km</Text>
        <Text style={styles.stat}>{formatDuration(run.duration_seconds)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    paddingBottom: 4,
  },
  photo: {
    width: '100%',
    height: 160,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
  },
  stat: {
    fontSize: 14,
    fontWeight: '500',
  },
})
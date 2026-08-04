import { Run } from "@/types/run"
import { View, Text, Image, StyleSheet, useColorScheme } from "react-native"
import { useMemo } from "react";

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPace(total_seconds: number, total_distance: number) {
  const min_per_km = (total_seconds/60) / total_distance;
  const minutes = Math.floor(min_per_km);
  const seconds = Math.round((min_per_km-minutes)*60);

  if (seconds === 60) {
    return `${minutes+1}:00`;
  }
  return `${minutes}:${seconds.toString().padStart(2,'0')}`;
}

interface Palette {
  cardBg: string
  title: string
  stat: string
  statHeading: string
  shadow: string
}

const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    cardBg: '#fff',
    title: '#111',
    stat: '#111',
    statHeading: '#666',
    shadow: '#000',
  },
  dark: {
    cardBg: '#1c1c1e',
    title: '#f2f2f2',
    stat: '#f2f2f2',
    statHeading: '#9a9a9e',
    shadow: '#000',
  },
} as const;


function StatItem({value, label, colors}: {value: string, label: string, colors: Palette}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.stat, {color: colors.stat}]}>{value}</Text>
      <Text style={[styles.statHeading, {color: colors.statHeading}]}>{label}</Text>
    </View>
  );
}

export function RunCard({ run }: { run: Run }) {
  const colorScheme = useColorScheme();
  const colors = useMemo(() => palettes[colorScheme === 'dark' ? 'dark' : 'light'], [colorScheme]);

  return (
  <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
      <View style={styles.header}>
        <Image
          source={{ uri: run.profiles?.avatar_url ?? undefined }}
          style={styles.avatar}
        />
        <Text style={[styles.title, {color: colors.title}]}>{run.title}</Text>
      </View>
      

      <Image source={{ uri: run.photo_url }} style={styles.photo} />

      
      <View style={styles.statsRow}>
        <StatItem value={`${formatPace(run.duration_seconds, run.distance_km)}`} label={'Pace'} colors={colors}/>
        <StatItem value={`${run.distance_km} km`} label={'Distance'} colors={colors}/>
        <StatItem value={`${formatDuration(run.duration_seconds)}`} label={'Duration'} colors={colors}/>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 4,
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc', // fallback bg while loading / if null
  },
  title: {
    fontSize: 16,
    fontWeight: '600'
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
  statHeading: {
    fontSize: 10,
    fontWeight: '400',
    padding: 6,
    paddingBottom: 4
  },
  statItem: {
    alignItems: 'center'
  }
})
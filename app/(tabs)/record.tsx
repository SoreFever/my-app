import { useState, useEffect, useRef } from "react";
import { TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

function haversineDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number },
) {
  const R = 6371; // km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatTimer(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPace(elapsedSeconds: number, distanceKm: number) {
  if (distanceKm === 0) return "--:--";
  const paceMinPerKm = elapsedSeconds / 60 / distanceKm;
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatRollingPace(paceMinPerKm: number) {
  if (!paceMinPerKm || paceMinPerKm <= 0) return "--:--";
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function Record() {
  const [tracking, setTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const recentSpeeds = useRef<number[]>([]); // Store recent speeds for smoothing
  const [currentPaceMinPerKm, setCurrentPaceMinPerKm] = useState(0); // Current pace in min/km

  const mutedColor = useThemeColor({}, "muted");
  const tintColor = useThemeColor({}, "tint");
  const bgColor = useThemeColor({}, "background");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const lastCoord = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      locationSubscription.current?.remove();
    };
  }, []);

  async function startRun() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Location permission is required to record a run.");
      return;
    }

    setElapsedSeconds(0);
    setDistanceKm(0);
    setCurrentPaceMinPerKm(0);
    lastCoord.current = null;
    recentSpeeds.current = [];
    setTracking(true);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (location) => {
        const { latitude, longitude, speed } = location.coords;
        if (lastCoord.current) {
          const delta = haversineDistance(lastCoord.current, {
            latitude,
            longitude,
          });
          setDistanceKm((prev) => prev + delta);
        }
        lastCoord.current = { latitude, longitude };

        if (speed && speed > 0) {
          recentSpeeds.current.push(speed);
          if (recentSpeeds.current.length > 8) recentSpeeds.current.shift();
          const avgSpeed = recentSpeeds.current.reduce((a, b) => a + b, 0) / recentSpeeds.current.length;
          setCurrentPaceMinPerKm(avgSpeed > 0 ? (1000 / avgSpeed) / 60 : 0);
        }
      },
    );
  }

  function stopRun() {
    setTracking(false);
    if (timerRef.current) clearInterval(timerRef.current);
    locationSubscription.current?.remove();
    // TODO: save to Supabase `runs` table here once you're ready
  }

  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "space-between",
        padding: 24,
        paddingTop: 60,
        paddingBottom: 60,
      }}
    >
      <ThemedView style={{ alignItems: "center" }}>
        <ThemedText style={{ fontSize: 16, color: mutedColor }}>
          Distance
        </ThemedText>
        <ThemedText style={{ fontSize: 32, fontWeight: "600", lineHeight: 38 }}>
          {distanceKm.toFixed(2)} km
        </ThemedText>
      </ThemedView>

      <ThemedView style={{ alignItems: "center" }}>
        <ThemedText style={{ fontSize: 16, color: mutedColor }}>
          Time
        </ThemedText>
        <ThemedText style={{ fontSize: 56, fontWeight: "700", lineHeight: 64 }}>
          {formatTimer(elapsedSeconds)}
        </ThemedText>
      </ThemedView>

      <ThemedView style={{ alignItems: "center" }}>
        <ThemedText style={{ fontSize: 16, color: mutedColor }}>
          Pace
        </ThemedText>
        <ThemedText style={{ fontSize: 32, fontWeight: "600", lineHeight: 38 }}>
          {formatRollingPace(currentPaceMinPerKm)} /km
        </ThemedText>
      </ThemedView>

      <TouchableOpacity
        onPress={tracking ? stopRun : startRun}
        style={{
          backgroundColor: tracking ? "#e74c3c" : tintColor,
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
        }}
      >
        <ThemedView
          style={{
            width: tracking ? 28 : 60,
            height: tracking ? 28 : 60,
            borderRadius: tracking ? 6 : 30,
            backgroundColor: "#e74c3c",
          }}
          />
      </TouchableOpacity>
    </ThemedView>
  );
}

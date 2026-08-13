import { useState, useEffect, useRef } from "react";
import { TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { supabase } from "@/lib/supabase";

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

type RunState = "idle" | "tracking" | "finished";

export default function Record() {
  const [runState, setRunState] = useState<RunState>("idle");
  // const [tracking, setTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const recentSpeeds = useRef<number[]>([]); // Store recent speeds for smoothing
  const [currentPaceMinPerKm, setCurrentPaceMinPerKm] = useState(0); // Current pace in min/km
  const [saving, setSaving] = useState(false);

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

  async function startTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Location permission is required to record a run.");
      return;
    }

    setRunState("tracking");

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 2,
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
          const avgSpeed =
            recentSpeeds.current.reduce((a, b) => a + b, 0) /
            recentSpeeds.current.length;
          setCurrentPaceMinPerKm(avgSpeed > 0 ? 1000 / avgSpeed / 60 : 0);
        }
      },
    );
  }

  // pause tracking without resetting stats — used when user hits "Stop"
  function pauseTracking() {
    if (timerRef.current) clearInterval(timerRef.current);
    locationSubscription.current?.remove();
    setRunState("finished");
  }

  // resume tracking from where it left off
  async function continueTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Location permission is required to continue.");
      return;
    }

    setRunState("tracking");

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // don't reset lastCoord — next point will just calculate distance from where we paused
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 2,
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
          const avgSpeed =
            recentSpeeds.current.reduce((a, b) => a + b, 0) /
            recentSpeeds.current.length;
          setCurrentPaceMinPerKm(avgSpeed > 0 ? 1000 / avgSpeed / 60 : 0);
        }
      },
    );
  }

  function resetAll() {
    setElapsedSeconds(0);
    setDistanceKm(0);
    setCurrentPaceMinPerKm(0);
    lastCoord.current = null;
    recentSpeeds.current = [];
    setRunState("idle");
  }

  async function saveRun() {
    setSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId || distanceKm <= 0 || elapsedSeconds <= 0) {
      alert("Can't save an empty or invalid run.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("runs").insert({
      user_id: userId,
      distance_km: Math.round(distanceKm * 100) / 100, // round to 2 decimal places
      duration_seconds: elapsedSeconds,
    });

    setSaving(false);

    if (error) {
      console.log("save run error:", error);
      alert("Failed to save run.");
      return;
    }

    resetAll();
  }

  function discardRun() {
    resetAll();
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

      {runState === "idle" && (
        <TouchableOpacity
          onPress={startTracking}
          style={{
            backgroundColor: tintColor,
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
          }}
        >
          <ThemedText
            style={{
              color: bgColor,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Start
          </ThemedText>
        </TouchableOpacity>
      )}

      {runState === "tracking" && (
        <TouchableOpacity
          onPress={pauseTracking}
          style={{
            backgroundColor: "e74c3c",
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
          }}
        >
          <ThemedText
            style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Stop
          </ThemedText>
        </TouchableOpacity>
      )}

      {runState === "finished" && (
        <ThemedView
          style={{ flexDirection: "row", justifyContent: "space-around" }}
        >
          <TouchableOpacity
            onPress={continueTracking}
            style={{ alignItems: "center" }}
          >
            <ThemedText style={{ color: tintColor, fontWeight: "600" }}>
              Continue
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={discardRun}
            style={{ alignItems: "center" }}
          >
            <ThemedText style={{ color: "#e74c3c", fontWeight: "600" }}>
              Discard
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={saveRun}
            disabled={saving}
            style={{ alignItems: "center" }}
          >
            <ThemedText style={{ color: tintColor, fontWeight: "600" }}>
              {saving ? "Saving..." : "Save"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
}

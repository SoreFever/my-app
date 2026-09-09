import { useState, useEffect, useRef } from "react";
import { Alert, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { supabase } from "@/lib/supabase";
import { markRunsDirty } from "@/lib/runsSignal";
import MapView, { Polyline, Marker } from "react-native-maps";
import {AppState, AppStateStatus} from "react-native"

const LOCATION_OPTIONS = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 1000,
  distanceInterval: 2,
};

function haversineDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number },
) {
  const R = 6371;
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

function formatRollingPace(paceMinPerKm: number) {
  if (!paceMinPerKm || paceMinPerKm <= 0) return "--:--";
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

type RunState = "idle" | "tracking" | "finished";
type Coord = { latitude: number; longitude: number };

export default function Record() {
  const router = useRouter();

  const [runState, setRunState] = useState<RunState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentPaceMinPerKm, setCurrentPaceMinPerKm] = useState(0);
  const [saving, setSaving] = useState(false);

  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [currentRegion, setCurrentRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);

  const mutedColor = useThemeColor({}, "muted");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const lastCoord = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );
  const lastAltitude = useRef<number | null>(null);
  const [elevationGainM, setElevationGainM] = useState(0);
  const recentSpeeds = useRef<number[]>([]);
  const mapRef = useRef<MapView | null>(null);
  const runStateRef = useRef<RunState>("idle");

  useEffect(() => {
    runStateRef.current = runState;
  }, [runState]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "background" && runStateRef.current === "tracking") {
        pauseTracking();
        Alert.alert(
          "Run Paused",
          "Tracking was paused because the app went to the background. Tap continue to resume."
        );
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    Location.getCurrentPositionAsync({})
      .then((location) => {
        const { latitude, longitude } = location.coords;
        setCurrentRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      })
      .catch(() => {});

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      locationSubscription.current?.remove();
    };
  }, []);

  function handleLocationUpdate(location: Location.LocationObject) {
    const { latitude, longitude, speed, altitude } = location.coords;
    const newCoord = { latitude, longitude };

    if (lastCoord.current) {
      const delta = haversineDistance(lastCoord.current, newCoord);
      setDistanceKm((prev) => Math.round((prev + delta) * 100) / 100);
    }
    lastCoord.current = newCoord;
    setRouteCoords((prev) => [...prev, newCoord]);
    setCurrentRegion((prev) => ({
      latitude,
      longitude,
      latitudeDelta: prev?.latitudeDelta ?? 0.005,
      longitudeDelta: prev?.longitudeDelta ?? 0.005,
    }));
    mapRef.current?.animateCamera(
      { center: { latitude, longitude } },
      { duration: 500 },
    );

    if (altitude != null) {
      if (lastAltitude.current != null) {
        const altDelta = altitude - lastAltitude.current;
        if (altDelta > 0) {
          setElevationGainM((prev) => Math.round((prev + altDelta) * 10) / 10);
        }
      }
      lastAltitude.current = altitude;
    }

    if (speed && speed > 0) {
      recentSpeeds.current.push(speed);
      if (recentSpeeds.current.length > 8) recentSpeeds.current.shift();
      const avgSpeed =
        recentSpeeds.current.reduce((a, b) => a + b, 0) /
        recentSpeeds.current.length;
      setCurrentPaceMinPerKm(avgSpeed > 0 ? 1000 / avgSpeed / 60 : 0);
    }
  }

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
      LOCATION_OPTIONS,
      handleLocationUpdate,
    );
  }

  function pauseTracking() {
    if (timerRef.current) clearInterval(timerRef.current);
    locationSubscription.current?.remove();
    setRunState("finished");
  }

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

    locationSubscription.current = await Location.watchPositionAsync(
      LOCATION_OPTIONS,
      handleLocationUpdate,
    );
  }

  function resetAll() {
    setElapsedSeconds(0);
    setDistanceKm(0);
    setCurrentPaceMinPerKm(0);
    setElevationGainM(0);
    setRouteCoords([]);
    lastCoord.current = null;
    lastAltitude.current = null;
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

    const { data, error } = await supabase
      .from("runs")
      .insert({
        user_id: userId,
        distance_km: distanceKm,
        duration_seconds: elapsedSeconds,
        elevation_gain_m: elevationGainM,
      })
      .select("id")
      .single();

    setSaving(false);

    if (error || !data) {
      console.log("save run error:", error);
      alert("Failed to save run.");
      return;
    }

    markRunsDirty();
    resetAll();
    router.push(`/edit-run/${data.id}`);
  }

  function discardRun() {
    resetAll();
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      {currentRegion && (
        <MapView
          ref={mapRef}
          style={{ width: "100%", height: 260 }}
          initialRegion={currentRegion}
          showsUserLocation
          followsUserLocation={runState === "tracking"}
        >
          {routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={tintColor}
              strokeWidth={4}
            />
          )}
          {routeCoords.length > 0 && (
            <Marker
              coordinate={routeCoords[0]}
              title="Start"
              pinColor="green"
            />
          )}
        </MapView>
      )}

      <ThemedView
        style={{
          flex: 1,
          justifyContent: "space-between",
          padding: 24,
          paddingTop: 20,
          paddingBottom: 60,
        }}
      >
        <ThemedView style={{ alignItems: "center" }}>
          <ThemedText style={{ fontSize: 16, color: mutedColor }}>
            Distance
          </ThemedText>
          <ThemedText
            style={{ fontSize: 32, fontWeight: "600", lineHeight: 38 }}
          >
            {distanceKm.toFixed(2)} km
          </ThemedText>
        </ThemedView>

        <ThemedView style={{ alignItems: "center" }}>
          <ThemedText style={{ fontSize: 16, color: mutedColor }}>
            Time
          </ThemedText>
          <ThemedText
            style={{ fontSize: 56, fontWeight: "700", lineHeight: 64 }}
          >
            {formatTimer(elapsedSeconds)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={{ alignItems: "center" }}>
          <ThemedText style={{ fontSize: 16, color: mutedColor }}>
            Pace
          </ThemedText>
          <ThemedText
            style={{ fontSize: 32, fontWeight: "600", lineHeight: 38 }}
          >
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
                color: backgroundColor,
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
              backgroundColor: "#e74c3c",
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
            }}
          >
            <ThemedText
              style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
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
    </ThemedView>
  );
}

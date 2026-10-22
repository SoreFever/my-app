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
import { AppState, AppStateStatus } from "react-native";

function haversineDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number },
) {
  const R = 6371; // earth radius in km
  const dLatitude = convertToRad(coord2.latitude - coord1.latitude);
  const dLongitude = convertToRad(coord2.longitude - coord1.longitude);
  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(convertToRad(coord1.latitude)) *
      Math.cos(convertToRad(coord2.latitude)) *
      Math.sin(dLongitude / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function convertToRad(degree: number) {
  return (degree * Math.PI) / 180;
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

const LOCATION_OPTIONS = {
  accuracy: Location.Accuracy.Highest,
  distanceInterval: 5,
};

export default function Record() {
  const router = useRouter();

  // Theming
  const mutedColor = useThemeColor({}, "muted");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  // Tracking
  const [runState, setRunState] = useState<RunState>("idle");
  const [saving, setSaving] = useState(false);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [currentRegion, setCurrentRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const recentSpeeds = useRef<number[]>([]);
  const lastAltitude = useRef<number | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const lastCoord = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );
  const lastTimestamp = useRef(0);

  // References
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const runStateRef = useRef<RunState>("idle");
  const segmentStartRef = useRef<number | null>(null);  // when current run segment started
  const accumulatedMsRef = useRef(0);                   // total ms from earlier segments

  // Viewable stats
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentPaceMinPerKm, setCurrentPaceMinPerKm] = useState(0);
  const [elevationGainM, setElevationGainM] = useState(0);

  useEffect(() => {
    runStateRef.current = runState;
  }, [runState]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "background" && runStateRef.current === "tracking") {
          pauseTracking();
          Alert.alert(
            "Run Paused",
            "Tracking was paused because the app went to the background. Tap continue to resume.",
          );
        }
      },
    );

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
    const { latitude, longitude, speed, altitude, accuracy } = location.coords;
    if (accuracy == null || accuracy > 25) return; // ignore poor fixes
    const newCoord = { latitude, longitude };

    if (lastCoord.current) {
      const delta = haversineDistance(lastCoord.current, newCoord);
      const dtSec = (location.timestamp - lastTimestamp.current) / 1000;
      if (delta * 1000 < 2 || (dtSec > 0 && (delta * 1000) / dtSec > 12))
        return;
      setDistanceKm((prev) => prev + delta);
    }

    lastCoord.current = newCoord;
    lastTimestamp.current = location.timestamp;

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

    if (speed != null && speed > 0.8) {
      recentSpeeds.current.push(speed);
      if (recentSpeeds.current.length > 8) recentSpeeds.current.shift();
      const avg =
        recentSpeeds.current.reduce((a, b) => a + b, 0) /
        recentSpeeds.current.length;
      setCurrentPaceMinPerKm(1000 / avg / 60);
    } else {
      recentSpeeds.current = [];
      setCurrentPaceMinPerKm(0);
    }
  }

  async function startTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Location permission is required to record a run.");
      return;
    }

    setRunState("tracking");
    startTimer();
    locationSubscription.current?.remove();
    locationSubscription.current = await Location.watchPositionAsync(
      LOCATION_OPTIONS,
      handleLocationUpdate,
    );
  }

  function pauseTracking() {
    setRunState("finished");
    stopTimer();
    locationSubscription.current?.remove();
    locationSubscription.current = null;
  }

  async function continueTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Location permission is required to continue.");
      return;
    }

    setRunState("tracking");
    startTimer();
    locationSubscription.current?.remove();
    locationSubscription.current = await Location.watchPositionAsync(
      LOCATION_OPTIONS,
      handleLocationUpdate,
    );
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);

    segmentStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (segmentStartRef.current == null) return;
      const totalMs = accumulatedMsRef.current + (Date.now() - segmentStartRef.current);
      setElapsedSeconds(Math.floor(totalMs/1000));
    }, 250);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    if (segmentStartRef.current != null) {
      accumulatedMsRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    setElapsedSeconds(Math.floor(accumulatedMsRef.current / 1000))
  }

  function resetAll() {
    // Viewable stats
    setElapsedSeconds(0);
    setDistanceKm(0);
    setCurrentPaceMinPerKm(0);
    setElevationGainM(0);

    // Tracking
    setRouteCoords([]);
    lastCoord.current = null;
    lastAltitude.current = null;
    recentSpeeds.current = [];
    setRunState("idle");
    lastTimestamp.current = 0;
    accumulatedMsRef.current = 0;
    segmentStartRef.current = null;
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

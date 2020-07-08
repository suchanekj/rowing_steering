import React, { useState, useEffect, useRef } from "react";
import { View, Linking, Platform } from "react-native";
import { FAB, Banner } from "react-native-paper";
import MapView, { Polyline } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-community/async-storage";

export default function Start() {
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);
  const [locationBuffer, setLocationBuffer] = useState([]);
  const [headingBuffer, setHeadingBuffer] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  const map = useRef(null);

  useEffect(() => {
    // Ask for permissions on component mount
    async function requestLocationPermission() {
      const { status } = await Location.requestPermissionsAsync();
      setPermissionGranted(status === "granted");
      const initialLocation = await Location.getLastKnownPositionAsync();
      setInitialRegion({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
    requestLocationPermission();
  }, []);

  useEffect(() => {
    // Start/stop location tracking
    async function startTracking() {
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          setLocationBuffer((locationBuffer) => [...locationBuffer, location]);
        }
      );
      const headingSubscription = await Location.watchHeadingAsync(
        ({ trueHeading }) => {
          setHeadingBuffer((headingBuffer) => [...headingBuffer, trueHeading]);
        }
      );
      setSubscriptions([locationSubscription, headingSubscription]);
    }
    if (isStarted && !isPaused && permissionGranted) {
      startTracking();
      return () => subscriptions.map((subscription) => subscription.remove());
    }
  }, [isStarted, isPaused]);

  useEffect(() => {
    // Save location data as an outing and reset locationBuffer
    async function storeOuting() {
      try {
        const jsonValue = JSON.stringify({
          date: locationBuffer[0].timestamp,
          location: (
            await Location.reverseGeocodeAsync(locationBuffer[0].coords)
          )[0],
          path: locationBuffer,
        });
        const key = (await AsyncStorage.getAllKeys()).length++;
        await AsyncStorage.setItem(key.toString(), jsonValue);
        setLocationBuffer([]); // Reset location buffer
        setHeadingBuffer([]); // Reset heading buffer
      } catch (e) {
        // saving error
      }
    }
    if (!isStarted && locationBuffer.length > 0) {
      storeOuting();
    }
  }, [isStarted]);

  useEffect(() => {
    // Fit map to coordinates every 30 location updates
    if (locationBuffer.length % 30 === 0 && locationBuffer.length > 0) {
      map.current.fitToCoordinates(
        [locationBuffer[0], locationBuffer[locationBuffer.length - 1]],
        {
          animated: true,
          edgePadding: { top: 0.005, right: 0.005, bottom: 0.005, left: 0.005 },
        }
      );
    }
  }, [locationBuffer]);

  return (
    <>
      <Banner
        visible={!permissionGranted}
        icon="alert"
        actions={[
          {
            label: "Fix it",
            onPress: () => {
              // Open the app's custom settings
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]}
      >
        You must enable location permissions for this app to work.
      </Banner>
      {initialRegion ? (
        <MapView
          ref={map}
          style={{ flex: 3 }}
          initialRegion={initialRegion}
          showsUserLocation={true}
        >
          {locationBuffer.length > 0 ? (
            <Polyline
              coordinates={locationBuffer.map((location) => location.coords)}
              strokeColor="#e30000"
              strokeWidth={6}
            />
          ) : null}
        </MapView>
      ) : null}
      <View
        style={{
          position: "absolute",
          margin: 16,
          right: 0,
          bottom: 0,
        }}
      >
        {isStarted ? (
          <FAB
            icon={isPaused ? "play" : "pause"}
            style={{
              backgroundColor: "blue",
            }}
            onPress={() => setIsPaused(!isPaused)}
          />
        ) : null}
        <FAB
          icon={isStarted ? "stop" : "play"}
          style={{
            marginTop: 10,
            backgroundColor: isStarted ? "red" : "green",
          }}
          onPress={() => {
            setIsStarted(!isStarted);
            setIsPaused(false);
          }}
        />
      </View>
    </>
  );
}

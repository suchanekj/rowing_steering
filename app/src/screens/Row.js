import React, { useState, useEffect } from "react";
import { View, Linking, Platform } from "react-native";
import { FAB, Banner } from "react-native-paper";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-community/async-storage";

export default function Start() {
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [locationBuffer, setLocationBuffer] = useState([]);
  const [headingBuffer, setHeadingBuffer] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    // Ask for permissions on component mount
    async function requestLocationPermission() {
      const { status } = await Location.requestPermissionsAsync();
      setPermissionGranted(status === "granted");
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
        const jsonValue = JSON.stringify(locationBuffer);
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
      <MapView
        style={{ flex: 3 }}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
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

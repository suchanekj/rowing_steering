import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Linking,
  Platform,
  NativeModules,
  NativeEventEmitter,
} from "react-native";
import { FAB, Banner, Snackbar } from "react-native-paper";
import MapView, { Polyline } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-community/async-storage";
import BLEManager from "react-native-ble-manager";

import { SettingsContext } from "../utils";

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default function Start() {
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);
  const [locationBuffer, setLocationBuffer] = useState([]);
  const [headingBuffer, setHeadingBuffer] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState({ status: false, message: "" });
  const [rudderAngle, setRudderAngle] = useState(90);

  const map = useRef(null);

  const { settings } = useContext(SettingsContext);

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

  function handleControllerUpdate({
    value,
    peripheralID,
    characteristic,
    service,
  }) {
    // Handle rudder change update
    if (characteristic === RUDDER_CHANGE_CHARACTERISTIC) {
      const data = Buffer.Buffer.from(value).readInt8;
      let newRudderAngle = null;
      if (data === 1) {
        // Move rudder right
        newRudderAngle = rudderAngle + 1;
      } else {
        // Move rudder left
        newRudderAngle = rudderAngle - 1;
      }
      if (newRudderAngle && newRudderAngle >= 0 && newRudderAngle <= 180) {
        setRudderAngle(newRudderAngle);
        BLEManager.write(
          settings.servo.id,
          SERVO_SERVICE,
          RUDDER_ANGLE_CHARACTERISTIC,
          new Int8Array([newRudderAngle])
        );
      }
    }

    // Handle servo characteristic updates here
  }

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

    // Start collecting readings from controller and sending data to servo
    async function startControl() {
      await BLEManager.startNotification(
        settings.controller.id,
        CONTROLLER_SERVICE,
        RUDDER_CHANGE_CHARACTERISTIC
      );
      bleManagerEmitter.addListener(
        "BleManagerDidUpdateValueForCharacteristic",
        handleControllerUpdate
      );
    }
    if (isStarted && settings.mode === "manual") {
      try {
        startControl();
        return async () =>
          BLEManager.stopNotification(
            settings.controller.id,
            CONTROLLER_SERVICE,
            RUDDER_CHANGE_CHARACTERISTIC
          );
      } catch {
        setError({ status: true, message: "Error: cannot start controller" });
      }
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
      <Snackbar
        duration={2000}
        visible={error.status}
        onDismiss={() => setError({ status: false, message: "" })}
      >
        {error.message}
      </Snackbar>
    </>
  );
}

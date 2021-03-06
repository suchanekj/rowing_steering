import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Linking, Platform } from "react-native";
import { FAB, Banner, Snackbar } from "react-native-paper";
import MapView, { Polyline } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-community/async-storage";
import BLEManager from "react-native-ble-manager";

import { StatusCard } from "../components";
import {
  SettingsContext,
  AutomaticController,
  bleManagerEmitter,
} from "../utils";
import {
  SERVO_SERVICE,
  BATTERY_LEVEL_CHARACTERISTIC,
  RUDDER_ANGLE_CHARACTERISTIC,
  CONTROLLER_SERVICE,
  RUDDER_CHANGE_CHARACTERISTIC,
  BATTERY_INFO_CHARACTERISTIC,
} from "../utils/BluetoothIDs";

const autoController = new AutomaticController();

export default function Row() {
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);
  const [locationBuffer, setLocationBuffer] = useState([]);
  const [headingBuffer, setHeadingBuffer] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState({ status: false, message: "" });
  const [rudderAngle, setRudderAngle] = useState(90);
  const [servoBatteryLevel, setServoBatteryLevel] = useState(null);

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
          if (settings.mode === "auto") {
            setRudderAngle(
              autoController.update(
                trueHeading,
                locationBuffer[locationBuffer.length - 1].coords,
                Date.now()
              )
            );
          }
        }
      );
      return [locationSubscription, headingSubscription];
    }
    if (isStarted && !isPaused && permissionGranted) {
      const subscriptions = startTracking();
      return async () => {
        (await subscriptions).map((subscription) => subscription.remove());
      };
    }
  }, [isStarted, isPaused]);

  function handleBluetoothCharacteristicUpdate({
    value,
    peripheralID,
    characteristic,
    service,
  }) {
    // Handle controller characteristic updates here
    if (
      service === CONTROLLER_SERVICE &&
      characteristic === RUDDER_CHANGE_CHARACTERISTIC
    ) {
      const newRudderAngle = Buffer.Buffer.from(value).readInt8();
      if ([-45, -1, 1, 45].includes(newRudderAngle)) {
        setRudderAngle(newRudderAngle);
      }
    }

    // Handle servo characteristic updates here
    if (
      service === SERVO_SERVICE &&
      characteristic === BATTERY_LEVEL_CHARACTERISTIC
    ) {
      const newBatteryLevel = Buffer.Buffer.from(value).readInt8();
      setServoBatteryLevel(newBatteryLevel);
    }
  }

  useEffect(() => {
    if (settings.servo) {
      BLEManager.write(
        settings.servo.id,
        SERVO_SERVICE,
        RUDDER_ANGLE_CHARACTERISTIC,
        new Int8Array([rudderAngle])
      );
    }
  }, [rudderAngle]);

  useEffect(() => {
    if (settings.controller) {
      BLEManager.write(
        settings.controller.id,
        CONTROLLER_SERVICE,
        BATTERY_INFO_CHARACTERISTIC,
        new Int8Array([servoBatteryLevel])
      );
    }
  }, [servoBatteryLevel]);

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

    // Start collecting readings from servo and controller
    async function startServo() {
      await BLEManager.startNotification(
        settings.servo.id,
        SERVO_SERVICE,
        BATTERY_LEVEL_CHARACTERISTIC
      );
    }

    async function startController() {
      await BLEManager.startNotification(
        settings.controller.id,
        CONTROLLER_SERVICE,
        RUDDER_CHANGE_CHARACTERISTIC
      );
    }

    if (isStarted && settings.mode !== "tracking") {
      try {
        startServo();
      } catch {
        setError({
          status: true,
          message: "Error: cannot start servo",
        });
        return;
      }
      if (settings.mode === "manual") {
        try {
          startController();
        } catch {
          setError({
            status: true,
            message: "Error: cannot start controller",
          });
          return;
        }
      }

      bleManagerEmitter.addListener(
        "BleManagerDidUpdateValueForCharacteristic",
        handleBluetoothCharacteristicUpdate
      );

      return async () => {
        await BLEManager.stopNotification(
          settings.servo.id,
          SERVO_SERVICE,
          BATTERY_LEVEL_CHARACTERISTIC
        );
        await BLEManager.stopNotification(
          settings.controller.id,
          CONTROLLER_SERVICE,
          RUDDER_CHANGE_CHARACTERISTIC
        );
      };
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
          flex: 1,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          margin: 16,
          right: 0,
          bottom: 0,
        }}
      >
        {isStarted ? (
          <StatusCard
            batteryLevel={servoBatteryLevel}
            rudderAngle={rudderAngle}
            speed={
              locationBuffer.length > 0
                ? locationBuffer[locationBuffer.length - 1].coords.speed
                : null
            }
            heading={
              headingBuffer.length > 0
                ? headingBuffer[headingBuffer.length - 1]
                : null
            }
          />
        ) : null}
        <View style={{ flex: 1, marginLeft: 8, maxWidth: 55 }}>
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

import React, { useState, useEffect, useContext } from "react";
import { View, ScrollView } from "react-native";
import {
  RadioButton,
  Button,
  Snackbar,
  TouchableRipple,
  Portal,
  Dialog,
  Subheading,
  List,
} from "react-native-paper";
import BLEManager from "react-native-ble-manager";

import { SettingsContext, bleManagerEmitter } from "../utils";

const DialogWithRadioBtns = ({
  options,
  selectedOption,
  setSelectedOption,
  visible,
  cancel,
  confirm,
}) => {
  function renderOption(option, key) {
    return (
      <TouchableRipple key={key} onPress={() => setSelectedOption(option)}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <View pointerEvents="none">
            <RadioButton
              value="normal"
              status={selectedOption === option ? "checked" : "unchecked"}
            />
          </View>
          <Subheading
            style={{
              paddingLeft: 8,
            }}
          >
            {option.id}
          </Subheading>
        </View>
      </TouchableRipple>
    );
  }

  return (
    <Portal>
      <Dialog dismissable={false} visible={visible}>
        <Dialog.Title>Select device</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: 170, paddingHorizontal: 0 }}>
          <ScrollView>
            <View>
              {options.map((option) => renderOption(option, option.id))}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={cancel}>Cancel</Button>
          <Button onPress={confirm}>Ok</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default function Settings() {
  const [scanningFor, setScanningFor] = useState(null);
  const [peripherals, setPeripherals] = useState([]);
  const [error, setError] = useState({ status: false, message: "" });

  const { settings, setSettings } = useContext(SettingsContext);

  useEffect(() => {
    bleManagerEmitter.addListener("BleManagerStopScan", async () => {
      // Scanning is stopped
      const peripherals = await BLEManager.getDiscoveredPeripherals();
      setPeripherals(peripherals);
    });
  }, []);

  useEffect(() => {
    async function connectToController() {
      try {
        await BLEManager.connect(settings.controller.id);
        await BLEManager.retrieveServices(settings.controller.id);
        return async () => BLEManager.disconnect(settings.controller.id);
      } catch (error) {
        setSettings((settings) => ({ ...settings, controller: null }));
        setError({ status: true, message: "Cannot connect to controller" });
      }
    }
    connectToController();
  }, [settings.controller]);

  useEffect(() => {
    async function connectToServo() {
      try {
        await BLEManager.connect(settings.servo.id);
        await BLEManager.retrieveServices(settings.servo.id);
        return async () => BLEManager.disconnect(settings.servo.id);
      } catch (error) {
        setSettings((settings) => ({ ...settings, servo: null }));
        setError({ status: true, message: "Cannot connect to servo" });
      }
    }
    connectToServo();
  }, [settings.servo]);

  function handleModeChange(value) {
    if (value === "manual" && !settings.controller && !settings.servo) {
      setError({
        status: true,
        message: "Must connect both a controller and servo",
      });
    } else if (value === "auto" && !settings.servo) {
      setError({
        status: true,
        message: "Must connect a servo",
      });
    } else {
      setSettings((settings) => ({ ...settings, mode: value }));
    }
  }

  return (
    <View style={{ flex: 1, marginVertical: 8, marginHorizontal: 4 }}>
      <List.Section title="Mode">
        <RadioButton.Group
          onValueChange={handleModeChange}
          value={settings.mode}
        >
          <RadioButton.Item
            style={{ marginHorizontal: 8 }}
            label="Tracking only"
            value="tracking"
          />
          <RadioButton.Item
            style={{ marginHorizontal: 8 }}
            label="Manual"
            value="manual"
          />
          <RadioButton.Item
            style={{ marginHorizontal: 8 }}
            label="Automatic"
            value="auto"
          />
        </RadioButton.Group>
      </List.Section>
      <List.Section title="Bluetooth devices">
        <Button
          style={{ marginVertical: 4, marginHorizontal: 8 }}
          mode="outlined"
          loading={scanningFor === "controller"}
          onPress={async () => {
            setScanningFor("controller");
            await BLEManager.scan([], 5, true);
          }}
        >
          {settings.controller ? "Controller connected" : "Connect controller"}
        </Button>
        <Button
          style={{ marginVertical: 4, marginHorizontal: 8 }}
          mode="outlined"
          loading={scanningFor === "servo"}
          onPress={async () => {
            setScanningFor("servo");
            await BLEManager.scan([], 5, true);
          }}
        >
          {settings.servo ? "Servo connected" : "Connect servo"}
        </Button>
        <DialogWithRadioBtns
          options={peripherals}
          selectedOption={settings[scanningFor]}
          setSelectedOption={(peripheral) =>
            setSettings((settings) => ({
              ...settings,
              [scanningFor]: peripheral,
            }))
          }
          visible={scanningFor !== null && peripherals.length > 0}
          cancel={() => {
            setPeripherals([]);
            setSettings((settings) => ({ ...settings, [scanningFor]: null }));
            setScanningFor(null);
          }}
          confirm={() => {
            setPeripherals([]);
            setScanningFor(null);
          }}
        />
      </List.Section>
      <Snackbar
        duration={2000}
        visible={error.status}
        onDismiss={() => setError({ status: false, message: "" })}
      >
        {error.message}
      </Snackbar>
    </View>
  );
}

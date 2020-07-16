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

import { SettingsContext } from "../utils";

const DialogWithRadioBtns = ({
  options,
  selectedOption,
  setSelectedOption,
  visible,
  cancel,
  confirm,
}) => {
  function renderOption(option) {
    return (
      <TouchableRipple onPress={() => setSelectedOption(option)}>
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
            {option.name}
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
            <View>{options.map((option) => renderOption(option))}</View>
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
  const [scanningForController, setScanningForController] = useState(false);
  const [scanningForServo, setScanningForServo] = useState(false);
  const [peripherals, setPeripherals] = useState([]);
  const [error, setError] = useState({ status: false, message: "" });

  const { settings, setSettings } = useContext(SettingsContext);

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
        </RadioButton.Group>
      </List.Section>
      <List.Section title="Bluetooth devices">
        <Button
          style={{ marginVertical: 4, marginHorizontal: 8 }}
          mode="outlined"
          loading={scanningForController}
          onPress={async () => {
            setScanningForController(true);
            await BLEManager.scan([], 5, true);
            setPeripherals(await BLEManager.getDiscoveredPeripherals());
          }}
        >
          {settings.controller ? "Controller connected" : "Connect controller"}
        </Button>
        <DialogWithRadioBtns
          options={peripherals}
          selectedOption={settings.controller}
          setSelectedOption={(peripheral) =>
            setSettings((settings) => ({ ...settings, controller: peripheral }))
          }
          visible={peripherals.length > 0}
          cancel={() => {
            setPeripherals([]);
            setSettings((settings) => ({ ...settings, controller: null }));
            setScanningForController(false);
          }}
          confirm={() => {
            setPeripherals([]);
            setScanningForController(false);
          }}
        />
        <Button
          style={{ marginVertical: 4, marginHorizontal: 8 }}
          mode="outlined"
          loading={scanningForServo}
          onPress={async () => {
            setScanningForServo(true);
            await BLEManager.scan([], 5, true);
            setPeripherals(await BLEManager.getDiscoveredPeripherals());
          }}
        >
          {settings.servo ? "Servo connected" : "Connect servo"}
        </Button>
        <DialogWithRadioBtns
          options={peripherals}
          selectedOption={settings.servo}
          setSelectedOption={(peripheral) =>
            setSettings((settings) => ({ ...settings, servo: peripheral }))
          }
          visible={peripherals.length > 0}
          cancel={() => {
            setPeripherals([]);
            setSettings((settings) => ({ ...settings, servo: null }));
            setScanningForServo(false);
          }}
          confirm={() => {
            setPeripherals([]);
            setScanningForServo(false);
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

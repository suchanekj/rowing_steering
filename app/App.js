import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import { Provider as ThemeProvider } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import BLEManager from "react-native-ble-manager";

import { Settings, Row, History } from "./src/screens";
import { theme, SettingsContext } from "./src/utils";

const Tab = createMaterialBottomTabNavigator();

export default function App() {
  const [settings, setSettings] = useState({
    controller: null,
    servo: null,
    mode: "tracking",
    modeError: false,
  });

  useEffect(() => {
    async function startBluetooth() {
      await BLEManager.start({ showAlert: true });
    }
    startBluetooth();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <SettingsContext.Provider
        value={{ settings: settings, setSettings: setSettings }}
      >
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Row"
            shifting={true}
            backBehavior="initialRoute"
          >
            <Tab.Screen
              name="Settings"
              component={Settings}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons
                    name="settings"
                    color={color}
                    size={26}
                  />
                ),
              }}
            />
            <Tab.Screen
              name="Row"
              component={Row}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons
                    name="rowing"
                    color={color}
                    size={26}
                  />
                ),
              }}
            />
            <Tab.Screen
              name="History"
              component={History}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons
                    name="history"
                    color={color}
                    size={26}
                  />
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SettingsContext.Provider>
    </ThemeProvider>
  );
}

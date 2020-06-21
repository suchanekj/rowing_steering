import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ThemeProvider } from "react-native-elements";
import { Icon } from "react-native-elements";

import { Settings, Start, History } from "./src/screens";
import { theme } from "./src/utils";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Start"
          tabBarOptions={{
            activeTintColor: theme.colors.actionable,
            labelPosition: "beside-icon",
          }}
        >
          <Tab.Screen
            name="Settings"
            component={Settings}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name="settings"
                  type="material"
                  color={color}
                  size={size}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Start"
            component={Start}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="rowing" type="material" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="History"
            component={History}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name="history"
                  type="material"
                  color={color}
                  size={size}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

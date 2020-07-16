import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { IconButton } from "react-native-paper";
import AsyncStorage from "@react-native-community/async-storage";

import { OutingsList, OutingDetail } from "../components";
import { theme } from "../utils";
import { NavigationHelpersContext } from "@react-navigation/native";

const Stack = createStackNavigator();

export default function History() {
  return (
    <Stack.Navigator initialRouteName="OutingsList">
      <Stack.Screen name="Outings" component={OutingsList} />
      <Stack.Screen
        name="OutingDetail"
        component={OutingDetail}
        options={({ navigation, route }) => ({
          title: "Outing on " + new Date(route.params.date).toDateString(),
          headerRight: () => (
            <IconButton
              icon="delete"
              color={theme.colors.primary}
              onPress={() => {
                const key = route.params.key;
                AsyncStorage.removeItem(key, () => navigation.goBack());
              }}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

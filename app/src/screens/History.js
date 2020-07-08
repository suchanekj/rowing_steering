import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { OutingsList, OutingDetail } from "../components";

const Stack = createStackNavigator();

export default function History() {
  return (
    <Stack.Navigator initialRouteName="OutingsList">
      <Stack.Screen name="Outings" component={OutingsList} />
      <Stack.Screen
        name="OutingDetail"
        component={OutingDetail}
        options={({ route }) => ({
          title: "Outing on " + Date(route.params.date).toString(),
        })}
      />
    </Stack.Navigator>
  );
}

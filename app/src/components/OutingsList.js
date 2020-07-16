import React, { useState, useCallback } from "react";
import { ScrollView } from "react-native";
import { List, Snackbar } from "react-native-paper";
import AsyncStorage from "@react-native-community/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function OutingsList({ navigation }) {
  const [outings, setOutings] = useState([]);
  const [error, setError] = useState({ status: false, message: "" });

  useFocusEffect(
    useCallback(() => {
      async function getOutings() {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const keyValuePairs = await AsyncStorage.multiGet(keys);
          setOutings(
            keyValuePairs.map((keyValuePair) => ({
              key: keyValuePair[0],
              ...JSON.parse(keyValuePair[1]),
            }))
          );
        } catch (error) {
          setError({
            status: true,
            message: "Error: cannot load outings",
          });
        }
      }
      getOutings();
    }, [])
  );

  return (
    <>
      <ScrollView>
        {outings.map((outing) => (
          <List.Item
            key={outing.date}
            title={new Date(outing.date).toDateString()}
            description={`${outing.location.city}, ${outing.location.region}`}
            left={(props) => <List.Icon {...props} icon="rowing" />}
            onPress={() => navigation.navigate("OutingDetail", outing)}
          />
        ))}
      </ScrollView>
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

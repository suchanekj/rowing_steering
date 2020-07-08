import React, { useState, useEffect } from "react";
import { List, Text } from "react-native-paper";
import AsyncStorage from "@react-native-community/async-storage";

export default function OutingsList({ navigation }) {
  const [outings, setOutings] = useState([]);

  useEffect(() => {
    async function getOutings() {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const keyValuePairs = await AsyncStorage.multiGet(keys);
        setOutings(
          keyValuePairs.map((keyValuePair) => JSON.parse(keyValuePair[1]))
        );
      } catch (e) {}
    }
    getOutings();
  }, []);

  return (
    <>
      {outings.map((outing) => (
        <List.Item
          key={outing.date}
          title={Date(outing.date).toString()}
          description={outing.location.region}
          left={(props) => <List.Icon {...props} icon="rowing" />}
          onPress={() => navigation.navigate("OutingDetail", outing)}
        />
      ))}
    </>
  );
}

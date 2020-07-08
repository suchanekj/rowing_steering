import React from "react";
import { View } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { Subheading } from "react-native-paper";

export default function OutingDetail({ route }) {
  const { date, location, path } = route.params;
  const range = path.reduce(
    (acc, { coords }) => {
      return {
        latitude: {
          min:
            coords.latitude > acc.latitude.min
              ? acc.latitude.min
              : coords.latitude,
          max:
            coords.latitude < acc.latitude.max
              ? acc.latitude.max
              : coords.latitude,
        },
        longitude: {
          min:
            coords.longitude > acc.longitude.min
              ? acc.longitude.min
              : coords.longitude,
          max:
            coords.longitude < acc.longitude.max
              ? acc.longitude.max
              : coords.longitude,
        },
      };
    },
    {
      latitude: { min: path[0].coords.latitude, max: path[0].coords.latitude },
      longitude: {
        min: path[0].coords.longitude,
        max: path[0].coords.longitude,
      },
    }
  );
  const initialRegion = {
    latitude: (range.latitude.max + range.latitude.min) / 2,
    longitude: (range.longitude.max + range.longitude.min) / 2,
    latitudeDelta: 0.005 + range.latitude.max - range.latitude.min,
    longitudeDelta: 0.005 + range.longitude.max - range.longitude.min,
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }} initialRegion={initialRegion}>
        <Polyline
          coordinates={path.coords}
          strokeColor="#e30000"
          strokeWidth={6}
        />
      </MapView>
      <View style={{ flex: 1 }}>
        <Subheading>{location.region}</Subheading>
      </View>
    </View>
  );
}

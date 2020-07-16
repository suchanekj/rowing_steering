import React from "react";
import { View } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { Paragraph, Divider } from "react-native-paper";
import getPathLength from "geolib/es/getPathLength";

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

  const totalDistance = getPathLength(path.map(({ coords }) => coords));
  const averageSpeed =
    (totalDistance * 1000) /
    (path[path.length - 1].timestamp - path[0].timestamp);

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 2 }} initialRegion={initialRegion}>
        <Polyline
          coordinates={path.map((location) => location.coords)}
          strokeColor="#e30000"
          strokeWidth={6}
        />
      </MapView>
      <Divider />
      <View style={{ flex: 1, margin: 16 }}>
        <Paragraph>
          Location: {location.city}, {location.region}
        </Paragraph>
        <Paragraph>Time: {new Date(date).toString()}</Paragraph>
        <Paragraph>Total distance: {totalDistance} m</Paragraph>
        <Paragraph>Average speed: {averageSpeed.toFixed(2)} m/s</Paragraph>
      </View>
    </View>
  );
}

import React from "react";
import { Card, Title, Paragraph } from "react-native-paper";

export function StatusCard({ batteryLevel, rudderAngle, speed, heading }) {
  return (
    <Card style={{ flex: 5, marginRight: 8 }}>
      <Card.Content>
        <Title>Status</Title>
        <Paragraph>Battery level: {batteryLevel}%</Paragraph>
        <Paragraph>Rudder angle: {rudderAngle}°</Paragraph>
        {speed ? (
          <Paragraph>
            Speed:{speed.toFixed(2)}
            m/s
          </Paragraph>
        ) : null}
        {heading ? <Paragraph>Heading: {heading.toFixed(1)}°</Paragraph> : null}
      </Card.Content>
    </Card>
  );
}

#include <ArduinoBLE.h>
#include "Servo.h"

#define LED1 2
#define LED2 3
// LED3 is green but doesn't work... :-(
#define LED3 4

#define BIG_V_READ A0
#define SMALL_V_READ A1

#define SERVO_PIN 9

BLEService steeringService("19B10000-E8F2-537E-4F6C-D104768A1214"); // BLE LED Service
// BLE LED Switch Characteristic - custom 128-bit UUID, read and writable by central
BLEByteCharacteristic switchCharacteristic("19B10001-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite);

Servo myservo;
float small_v, big_v;

void setup() {
  Serial.begin(9600);
  myservo.attach(SERVO_PIN);
  myservo.write(90);

  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);
  
  digitalWrite(LED1, HIGH);
  digitalWrite(LED2, HIGH);
  digitalWrite(LED3, HIGH);
  
  pinMode(BIG_V_READ, INPUT);
  pinMode(SMALL_V_READ, INPUT);

  BLE.begin();

  BLE.setLocalName("Steering");
  BLE.setAdvertisedService(steeringService);

  // add the characteristic to the service
  steeringService.addCharacteristic(switchCharacteristic);
  BLE.addService(steeringService);
  switchCharacteristic.writeValue(0);
  BLE.advertise();
}

void loop() {
  // put your main code here, to run repeatedly:
  big_v = analogRead(BIG_V_READ) * 10.0 / 1024;
  small_v = analogRead(SMALL_V_READ) * 10.0 / 1024;

  Serial.print(big_v);
  Serial.print("V \t");
  Serial.print(small_v);
  Serial.println("V");

  BLEDevice central = BLE.central();

  // if a central is connected to peripheral:
  if (central) {
    Serial.print("Connected to central: ");
    // print the central's MAC address:
    Serial.println(central.address());

    // while the central is still connected to peripheral:
    while (central.connected()) {
       byte val = 255;
      // if the remote device wrote to the characteristic,
      // use the value to control the LED:
      if (switchCharacteristic.written()) {
        val = switchCharacteristic.value();
        if(val <= 180) {
          myservo.write(val);
        }
      }
      big_v = analogRead(BIG_V_READ) * 6.6 / 1024;
      small_v = analogRead(SMALL_V_READ) * 6.6 / 1024;
      Serial.print(val);
      Serial.print("  \t");
      Serial.print(big_v);
      Serial.print("V \t");
      Serial.print(small_v);
      Serial.println("V");
    }

    // when the central disconnects, print it out:
    Serial.print(F("Disconnected from central: "));
    Serial.println(central.address());
  }
}

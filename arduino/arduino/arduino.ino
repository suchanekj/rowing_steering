#include <SoftwareSerial.h>
#include <Servo.h>

Servo myservo;  // create servo object to control a servo
SoftwareSerial mySerial(7, 8); // RX, TX  

// Connect HM10      Arduino Uno
//     Pin 1/TXD          Pin 7
//     Pin 2/RXD          Pin 8

void setup() {
  Serial.begin(9600);
  // If the baudrate of the HM-10 module has been updated,
  // you may need to change 9600 by another value
  // Once you have found the correct baudrate,
  // you can update it using AT+BAUDx command 
  // e.g. AT+BAUD0 for 9600 bauds
  mySerial.begin(9600);
  Serial.print(mySerial);
  myservo.attach(9);  // attaches the servo on pin 9 to the servo object

  pinMode(A0, INPUT); // voltage/2 read
  pinMode(A1, OUTPUT); // set to GND
  pinMode(A2, OUTPUT); // set led if voltage high

  digitalWrite(A1, LOW);
  digitalWrite(A2, HIGH);
}

int angle = 90;
int lower_lim = 10;
int upper_lim = 170;

void loop() {
  int voltage = analogRead(A0) * 10;
  
  if(voltage > 7400) digitalWrite(A2, HIGH);
  else digitalWrite(A2, LOW);
  
  if (mySerial.available()) {
    int new_angle = mySerial.read();
  
    if (new_angle != angle && lower_lim <= new_angle && upper_lim >= new_angle){
      Serial.print("Angle changed:");
      Serial.print(angle);
      Serial.print("-->");
      Serial.println(new_angle);
      angle = new_angle;
      myservo.write(angle);
      
    }
  }
 
  // sets the servo position according to the scaled value
  //delay(50);                           // waits for the servo to get there
  
}

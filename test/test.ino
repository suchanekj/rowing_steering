#include <Servo.h>

Servo myservo;  // create servo object to control a servo

int angle = 90;

void setup() {
  Serial.begin(9600);

  myservo.attach(9);  // attaches the servo on pin 9 to the servo object
  myservo.write(angle);

  pinMode(A0, INPUT); // voltage/2 read
  pinMode(A1, OUTPUT); // set to GND
  pinMode(A2, OUTPUT); // set led if voltage high

  digitalWrite(A1, LOW);
  digitalWrite(A2, HIGH);

}

void loop() {
  int voltage = analogRead(A0) * 10;
  
  if(voltage > 7400) digitalWrite(A2, HIGH);
  else digitalWrite(A2, LOW);
//  Serial.println(voltage);
  
  if (Serial.available()) {
    int new_angle = Serial.read();
  
    if (new_angle != 10 && new_angle != angle){
      new_angle -= 'a';
      new_angle = new_angle * 180 / 25;
      Serial.print("Angle changed:");
      Serial.print(angle);
      Serial.print("-->");
      Serial.println(new_angle);
      angle = new_angle;
      myservo.write(angle);
      
    }
  }
  
}

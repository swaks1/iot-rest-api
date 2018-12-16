//#include <stdio.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

const char *ssid = "Poposki";
const char *password = "10denari";

unsigned long commandCheckDelay = 10000; //10seconds
unsigned long lastCommandCheckTime;
unsigned long currentTime;

long delayLength = 3000;
String stringVariable;

void setup()
{
  Serial.begin(115200);
  delay(10);

  Serial.printf("\nConnecting to %s \n", ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected !!");
}

void loop()
{
  int sensorValue = analogRead(A0);             // read the input on analog pin 0
  float voltage = sensorValue * (3.3 / 1023.0); // Convert the analog reading (which goes from 0 - 1023) to a voltage (0 - 3.3V)
  Serial.printf("v:  %f \n", voltage);          // print out the voltage

  //check if there are commands on the server
  GetCommand();

  delay(delayLength);
}

void GetCommand()
{
  //will be executed every commandCheckDelay miliseconds
  bool shouldCheck = false;
  currentTime = millis();
  if (currentTime - lastCommandCheckTime > commandCheckDelay)
  {
    shouldCheck = true;
    lastCommandCheckTime = currentTime;
  }

  if (shouldCheck && WiFi.status() == WL_CONNECTED)
  {
    //Object of class HTTPClient
    HTTPClient http;

    Serial.print("Getting commands from server...\n[HTTP] begin...\n");

    if (http.begin("http://192.168.100.8:8000/api/command/notExecuted/5c155d5abea777461420387a"))
    {

      http.addHeader("Content-Type", "application/json"); //Specify content-type header

      Serial.print("[HTTP] GET...\n");
      // start connection and send HTTP header
      int httpCode = http.GET();

      // httpCode will be negative on error
      if (httpCode > 0)
      {
        // HTTP header has been send and Server response header has been handled
        Serial.printf("[HTTP] GET Code: %d\n", httpCode);

        // file found at server
        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY)
        {
          String payload = http.getString(); //.c_str() for print ?
          const size_t bufferSize = JSON_OBJECT_SIZE(2) + JSON_OBJECT_SIZE(6) + 190;

          //parse the input
          DynamicJsonBuffer jsonBuffer(bufferSize);

          JsonObject &root = jsonBuffer.parseObject(payload);

          Serial.printf("Recieved Command:  %s \n", payload.c_str());

          if (root.success())
          {
            const char *commandItem_commandValue = root["commandItem"]["commandValue"]; // "2"
            const char *commandItem_commandType = root["commandItem"]["commandType"];   // "testInterval"
            const char *_id = root["_id"];                                              // "5c168f95a87f39066c82de6d"

            delayLength = atol(commandItem_commandValue);
            Serial.printf("Changed delayLength to %ld \n", delayLength);

            //POST to server that this command has been executed
            Serial.printf("[HTTP] POST... for %s \n", _id);
            stringVariable = "{\"executed\":true,\"commandId\":\"";
            stringVariable += _id;
            stringVariable += "\"}";
            //http object is not closed... reusing the same connection ?
            int httpCodePost = http.POST(stringVariable); //Send the request
            if (httpCodePost > 0)
            {
              Serial.printf("[HTTP] POST Code: %d \t payload: %s \n", httpCodePost, http.getString().c_str());
            }
            else
            {
              Serial.println("Error in POSTING for command");
            }
          }
          else
          {
            Serial.println("Error in deserializing JSON command...");
          }
        }
      }
      else
      {
        Serial.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
      }

      http.end();
    }
    else
    {
      Serial.printf("[HTTP} Unable to connect\n");
    }
  }
}

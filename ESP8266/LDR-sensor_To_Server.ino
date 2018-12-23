//#include <stdio.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

const char *ssid = "Poposki";
const char *wifi_password = "10denari";

const char *DEVICE_NAME = "forthDevice";
const char *DEVICE_PASSWORD = "123456";

bool IS_ACTIVE = true;
bool IS_LOGGED_IN = false;
String DEVICE_ID = "";

String LOG_IN_ROUTE = "http://192.168.100.8:8000/api/devices/LogIn";
String DATA_ROUTE = "http://192.168.100.8:8000/api/data";
String CHECK_COMMAND_ROUTE = "http://192.168.100.8:8000/api/command/notExecuted/"; //DEVICE_ID to be added

unsigned long commandCheckDelay = 10000; //10seconds
unsigned long lastCommandCheckTime;
bool shouldCheckCommand = false;

unsigned long sendDataDelay = 5000;
unsigned long lastSendDataTime;
bool shouldSendData = false;

unsigned long currentTime;
String stringVariable;

void setup()
{
  Serial.begin(115200);
  delay(10);

  ConnectToWIFI();

  LoginToServer();

  InitRoutes();
}

void loop()
{
  int sensorValue = analogRead(A0);             // read the input on analog pin 0
  float voltage = sensorValue * (3.3 / 1023.0); // Convert the analog reading (which goes from 0 - 1023) to a voltage (0 - 3.3V)

  //send data to server
  SendSensorValue(voltage);

  //check if there are commands on the server
  GetCommand();

  delay(100);
}

void ConnectToWIFI()
{
  Serial.printf("\nConnecting to %s \n", ssid);

  WiFi.begin(ssid, wifi_password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected !!");
}

void LoginToServer()
{
  while (IS_LOGGED_IN == false)
  {
    if (WiFi.status() == WL_CONNECTED)
    {
      //Object of class HTTPClient
      HTTPClient http;

      Serial.print("\n\n\nTrying to login to the server...\nHTTP begin...\n");

      if (http.begin(LOG_IN_ROUTE))
      {

        http.addHeader("Content-Type", "application/json"); //Specify content-type header

        //CREATE PYALOAD
        const size_t bufferSize = JSON_OBJECT_SIZE(2);
        DynamicJsonBuffer jsonBuffer(bufferSize);

        JsonObject &root = jsonBuffer.createObject();
        root["name"] = DEVICE_NAME;
        root["password"] = DEVICE_PASSWORD;

        stringVariable = "";
        root.printTo(stringVariable);
        //END CREATE PYALOAD

        Serial.printf("HTTP POST login ... for %s \n", DEVICE_NAME);
        // start connection and send HTTP header
        int httpCode = http.POST(stringVariable);

        if (httpCode > 0)
        {
          // HTTP header has been send and Server response header has been handled
          Serial.printf("HTTP POST Code: %d\n", httpCode);

          String payload = http.getString(); //.c_str() for print ?

          const size_t bufferSize = JSON_OBJECT_SIZE(3) + JSON_OBJECT_SIZE(5) + 150;
          DynamicJsonBuffer jsonBuffer(bufferSize);

          JsonObject &root = jsonBuffer.parseObject(payload);

          Serial.printf("Recieved response from login:  %s \n", payload.c_str());

          if (root.success())
          {
            DEVICE_ID = root["_id"].as<String>(); // "5c1fa3aa0841ed4758e71df7"
            IS_LOGGED_IN = true;
          }
          else
          {
            Serial.println("Error in deserializing JSON login response...");
          }
        }
        else
        {
          Serial.printf("HTTP POST login FAILED ... Error: %s\n", http.errorToString(httpCode).c_str());
        }

        http.end();
      }
      else
      {
        Serial.printf("HTTP Unable to connect\n");
      }
    }

    delay(5000);
  }
}

void GetCommand()
{
  //will be executed every commandCheckDelay miliseconds
  shouldCheckCommand = false;
  currentTime = millis();
  if (currentTime - lastCommandCheckTime > commandCheckDelay)
  {
    shouldCheckCommand = true;
  }

  if (shouldCheckCommand && WiFi.status() == WL_CONNECTED)
  {
    //Object of class HTTPClient
    HTTPClient http;

    Serial.print("\n\n\nGetting commands from server...\nHTTP begin...\n");

    if (http.begin(CHECK_COMMAND_ROUTE))
    {

      http.addHeader("Content-Type", "application/json"); //Specify content-type header

      Serial.print("HTTP GET...\n");
      // start connection and send HTTP header
      int httpCode = http.GET();

      // httpCode will be negative on error
      if (httpCode > 0)
      {
        // HTTP header has been send and Server response header has been handled
        Serial.printf("HTTP GET Code: %d\n", httpCode);

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

            if (strcmp(commandItem_commandType, "SEND_DATA_DELAY") == 0)
            {
              //sendDataDelay = atol(commandItem_commandValue);
              sendDataDelay = root["commandItem"]["commandValue"]; //implicit cast to long ?
              Serial.printf("Changed sendDataDelay to %ld \n", sendDataDelay);
            }
            else if (strcmp(commandItem_commandType, "IS_ACTIVE") == 0)
            {
              IS_ACTIVE = root["commandItem"]["commandValue"]; //implicit cast to bool ?
              Serial.printf("Changed IS_ACTIVE to %s \n", IS_ACTIVE ? "TRUE" : "FALSE");
            }
            else
            {
              Serial.printf("UNKNWON COMMAND  %s ... ?\n", commandItem_commandType);
            }

            //POST to server that this command has been executed
            Serial.printf("HTTP POST... for %s \n", _id);
            stringVariable = "{\"executed\":true,\"commandId\":\"";
            stringVariable += _id;
            stringVariable += "\"}";
            //http object is not closed... reusing the same connection ?
            int httpCodePost = http.POST(stringVariable); //Send the request
            if (httpCodePost > 0)
            {
              Serial.printf("HTTP POST commands SUCCESSFUL ... Code: %d \t payload: %s \n", httpCodePost, http.getString().c_str());
            }
            else
            {
              Serial.printf("HTTP POST commands FAILED ... Error: %s\n", http.errorToString(httpCodePost).c_str());
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
        Serial.printf("HTTP GET commands FAILED ... error: %s\n", http.errorToString(httpCode).c_str());
      }

      http.end();
    }
    else
    {
      Serial.printf("HTTP Unable to connect\n");
    }

    //update last check time
    lastCommandCheckTime = millis();
  }
}

void SendSensorValue(float value)
{
  shouldSendData = false;
  currentTime = millis();
  if (currentTime - lastSendDataTime > sendDataDelay)
  {
    shouldSendData = true;
  }

  if (IS_ACTIVE && shouldSendData && WiFi.status() == WL_CONNECTED)
  {
    Serial.printf("\n\n\nv:  %f \n", value); // print out the value

    //Object of class HTTPClient
    HTTPClient http;

    Serial.print("Sending data to server...\nHTTP begin...\n");

    if (http.begin(DATA_ROUTE))
    {

      http.addHeader("Content-Type", "application/json"); //Specify content-type header

      //CREATE PYALOAD
      const size_t bufferSize = 2 * JSON_OBJECT_SIZE(2);
      DynamicJsonBuffer jsonBuffer(bufferSize);

      JsonObject &root = jsonBuffer.createObject();

      root["device"] = DEVICE_ID;

      JsonObject &dataItem = root.createNestedObject("dataItem");
      dataItem["dataValue"] = value;
      dataItem["dataType"] = "LIGHT SENSOR";

      stringVariable = "";
      root.printTo(stringVariable);
      //END CREATE PYALOAD

      Serial.printf("HTTP POST data ... for %s \n", DEVICE_ID.c_str());
      // start connection and send HTTP header
      int httpCode = http.POST(stringVariable);

      if (httpCode > 0)
      {
        Serial.printf("HTTP POST data SUCCESSFULL ... Code: %d \t payload: %s \n", httpCode, http.getString().c_str());
      }
      else
      {
        Serial.printf("HTTP POST data FAILED ... Error: %s\n", http.errorToString(httpCode).c_str());
      }

      http.end();
    }
    else
    {
      Serial.printf("HTTP Unable to connect\n");
    }

    //update last send time
    lastSendDataTime = millis();
  }
}

void InitRoutes(){
  CHECK_COMMAND_ROUTE += DEVICE_ID;
  //other routs to be initialized with DEVICE_ID ...
}
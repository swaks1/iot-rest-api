//#include <stdio.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

const char *ssid = "Poposki";
const char *wifi_password = "10denari";

const char *DEVICE_NAME = "forthDevice";
const char *DEVICE_PASSWORD = "123456";
const char *DEVICE_DESCRIPTION = "Opis za device";

bool IS_ACTIVE = true;
bool IS_LOGGED_IN = false;
String DEVICE_ID = "";

String GOOGLE_GEOLOCATION_FULL = "https://www.googleapis.com/geolocation/v1/geolocate?key=**ENTER_KEY_HERE**";
//Thumbprint od SSL sertifikatot na google...vazi do februari 2018.... vo setup se zema od API
uint8_t fingerprint[20] = {0xD6, 0x73, 0x98, 0x1A, 0x84, 0x96, 0x26, 0xD7, 0xF6, 0x10, 0x5D, 0x97, 0x8F, 0xE7, 0x47, 0x8A, 0x96, 0xB3, 0x46, 0x00};
int MAX_WIFI_SCAN = 127;
double latitude = 0.0;
double longitude = 0.0;
double accuracy = 0.0;

String LOG_IN_ROUTE = "http://192.168.100.8:8000/api/devices/LogIn";
String DATA_ROUTE = "http://192.168.100.8:8000/api/data";
String CHECK_COMMAND_ROUTE = "http://192.168.100.8:8000/api/command/notExecuted/"; //DEVICE_ID to be added
String DEVICE_INFO_ROUTE = "http://192.168.100.8:8000/api/devices/";               //DEVICE_ID to be added
String GOOGLE_CERTIFICATE_ROUTE = "http://192.168.100.8:8000/api/command/GetGoogleCertificate/Thumbprint";

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

  GetGoogleCertificate();
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
  WiFi.mode(WIFI_STA); // station ??? what for ??

  WiFi.disconnect(); //disconect if was it was previuously connected

  Serial.printf("\nConnecting to %s \n", ssid);

  WiFi.begin(ssid, wifi_password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected !!\n");
}

void LoginToServer()
{
  while (IS_LOGGED_IN == false)
  {
    if (WiFi.status() == WL_CONNECTED)
    {
      //Object of class HTTPClient
      HTTPClient http;

      Serial.print("\n\nhttp begin --LOGIN--:\n");

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

        Serial.printf("http post --LOGIN-- for %s \n", DEVICE_NAME);
        // start connection and send HTTP header
        int httpCode = http.POST(stringVariable);

        if (httpCode > 0)
        {
          // HTTP header has been send and Server response header has been handled
          Serial.printf("http post --LOGIN-- SUCCESSFULL ... Code: %d \t payload: %s \n", httpCode, http.getString().c_str());

          String payload = http.getString(); //.c_str() for print ?

          const size_t bufferSize = JSON_OBJECT_SIZE(3) + JSON_OBJECT_SIZE(5) + 150;
          DynamicJsonBuffer jsonBuffer(bufferSize);

          JsonObject &root = jsonBuffer.parseObject(payload);

          if (root.success())
          {
            DEVICE_ID = root["_id"].as<String>(); // "5c1fa3aa0841ed4758e71df7"
            IS_LOGGED_IN = true;
          }
          else
          {
            Serial.println("http post --LOGIN-- ERROR IN RESPONSE !!!: Error in deserializing JSON response...");
          }
        }
        else
        {
          Serial.printf("http post --LOGIN-- FAILED !!! : %s\n", http.errorToString(httpCode).c_str());
        }

        http.end();
      }
      else
      {
        Serial.printf("http begin --LOGIN-- FAILED !!! Unable to connect !!!!\n");
      }
    }
    else
    {
      Serial.printf("WiFi not connected --LOGIN-- \n");
    }

    delay(5000);
  }
}

void InitRoutes()
{
  CHECK_COMMAND_ROUTE += DEVICE_ID;
  DEVICE_INFO_ROUTE += DEVICE_ID;
  //other routs to be initialized with DEVICE_ID ...
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

    Serial.print("\n\nhttp begin --GET_COMMAND--:\n");

    if (http.begin(CHECK_COMMAND_ROUTE))
    {

      http.addHeader("Content-Type", "application/json"); //Specify content-type header

      Serial.printf("http get --GET_COMMAND-- \n");
      // start connection and send HTTP header
      int httpCode = http.GET();

      // httpCode will be negative on error
      if (httpCode > 0)
      {
        // HTTP header has been send and Server response header has been handled
        Serial.printf("http get --GET_COMMAND-- Code: %d\n", httpCode);

        // file found at server
        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY)
        {
          String payload = http.getString(); //.c_str() for print ?
          const size_t bufferSize = JSON_OBJECT_SIZE(2) + JSON_OBJECT_SIZE(6) + 190;

          //parse the input
          DynamicJsonBuffer jsonBuffer(bufferSize);

          JsonObject &root = jsonBuffer.parseObject(payload);

          Serial.printf("http get --GET_COMMAND-- Response:  %s \n", payload.c_str());

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
            else if (strcmp(commandItem_commandType, "DEVICE_INFO") == 0)
            {
              Serial.printf("Sending Device Information to Server..\n");
              SendDeviceInformation();
            }
            else
            {
              Serial.printf("UNKNWON COMMAND  %s ... ?\n", commandItem_commandType);
            }

            delay(500);

            //POST to server that this command has been executed
            Serial.printf("http post --POST_COMMAND-- for %s \n", _id);
            stringVariable = "{\"executed\":true,\"commandId\":\"";
            stringVariable += _id;
            stringVariable += "\"}";
            //http object is not closed... reusing the same connection ?
            int httpCodePost = http.POST(stringVariable); //Send the request
            if (httpCodePost > 0)
            {
              Serial.printf("http post --POST_COMMAND-- SUCCESSFULL ... Code: %d \t payload: %s \n", httpCodePost, http.getString().c_str());
            }
            else
            {
              Serial.printf("http post --POST_COMMAND-- FAILED !!! : %s\n", http.errorToString(httpCodePost).c_str());
            }
          }
          else
          {
            Serial.println("http get --GET_COMMAND-- ERROR IN RESPONSE !!!: Error in deserializing JSON response...");
          }
        }
      }
      else
      {
        Serial.printf("http get --GET_COMMAND-- FAILED !!! : %s\n", http.errorToString(httpCode).c_str());
      }

      http.end();
    }
    else
    {
      Serial.printf("http begin --GET_COMMAND-- FAILED !!! Unable to connect !!!!\n");
    }

    //update last check time
    lastCommandCheckTime = millis();
  }
  else
  {
    Serial.printf("WiFi not connected or timer --GET_COMMAND-- \n");
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
    Serial.printf("\n\nv:  %f \n", value); // print out the value

    //Object of class HTTPClient
    HTTPClient http;

    Serial.print("\n\nhttp begin --SEND_DATA--:\n");

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

      Serial.printf("http post --SEND_DATA-- for %s \n", DEVICE_ID.c_str());
      // start connection and send HTTP header
      int httpCode = http.POST(stringVariable);

      if (httpCode > 0)
      {
        Serial.printf("http post --SEND_DATA-- SUCCESSFULL ... Code: %d \t payload: %s \n", httpCode, http.getString().c_str());
      }
      else
      {
        Serial.printf("http post --SEND_DATA-- FAILED !!! : %s\n", http.errorToString(httpCode).c_str());
      }

      http.end();
    }
    else
    {
      Serial.printf("http begin --SEND_DATA-- FAILED !!! Unable to connect !!!!\n");
    }

    //update last send time
    lastSendDataTime = millis();
  }
  else
  {
    Serial.printf("WiFi not connected or timer --SEND_DATA-- \n");
  }
}

void SendDeviceInformation()
{
  GetLocation();

  delay(500);

  if (WiFi.status() == WL_CONNECTED)
  {
    //Object of class HTTPClient
    HTTPClient http;

    Serial.print("\n\nhttp begin --DEVICE_INFO--:\n");

    if (http.begin(DEVICE_INFO_ROUTE))
    {

      http.addHeader("Content-Type", "application/json"); //Specify content-type header

      //CREATE PYALOAD

      const size_t bufferSize = JSON_OBJECT_SIZE(3) + JSON_OBJECT_SIZE(4);
      DynamicJsonBuffer jsonBuffer(bufferSize);

      JsonObject &root = jsonBuffer.createObject();
      root["name"] = DEVICE_NAME;
      root["description"] = DEVICE_DESCRIPTION;

      JsonObject &location = root.createNestedObject("location");
      location["lat"] = latitude;
      location["lng"] = longitude;
      location["accuracy"] = accuracy;
      location["description"] = "Test Location Description";

      stringVariable = "";
      root.printTo(stringVariable);
      //END CREATE PYALOAD

      Serial.printf("http put --DEVICE_INFO-- for %s \n", DEVICE_ID.c_str());
      // start connection and send HTTP header
      int httpCode = http.PUT(stringVariable);

      if (httpCode > 0)
      {
        Serial.printf("http put --DEVICE_INFO-- SUCCESSFULL ... Code: %d \t payload: %s \n", httpCode, http.getString().c_str());
      }
      else
      {
        Serial.printf("http put --DEVICE_INFO-- FAILED !!! : %s\n", http.errorToString(httpCode).c_str());
      }

      http.end();
    }
    else
    {
      Serial.printf("http begin --DEVICE_INFO-- FAILED !!! Unable to connect !!!!\n");
    }
  }
  else
  {
    Serial.printf("WiFi not connected --DEVICE_INFO-- \n");
  }
}

void GetLocation()
{
  if (WiFi.status() == WL_CONNECTED)
  {

    String body = "{\"wifiAccessPoints\":" + getSurroundingWiFiJson() + "}";

    //unique_ptr is a smart pointer that owns and manages another object through a pointer and disposes of that object when the unique_ptr goes out of scope
    std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);

    client->setFingerprint(fingerprint);

    HTTPClient https;

    Serial.print("\n\nhttps begin --GET_LOCATION--:\n");
    if (https.begin(*client, GOOGLE_GEOLOCATION_FULL))
    { // HTTPS

      https.addHeader("Content-Type", "application/json"); //Specify content-type header

      Serial.printf("https post --GET_LOCATION--\n");
      // start connection and send HTTP header
      int httpCode = https.POST(body);

      // httpCode will be negative on error
      if (httpCode > 0)
      {
        // HTTP header has been send and Server response header has been handled
        Serial.printf("https post --GET_LOCATION-- SUCCESSFULL ... Code: %d \t payload: %s \n", httpCode, https.getString().c_str());

        String payload = https.getString();

        const size_t bufferSize = 2 * JSON_OBJECT_SIZE(2) + 80;
        DynamicJsonBuffer jsonBuffer(bufferSize);

        JsonObject &root = jsonBuffer.parseObject(payload);

        if (root.success())
        {
          latitude = root["location"]["lat"];
          longitude = root["location"]["lng"];
          accuracy = root["accuracy"];
        }
        else
        {
          Serial.println("https post --GET_LOCATION-- ERROR IN RESPONSE !!!: Error in deserializing JSON response...");
        }
      }
      else
      {
        Serial.printf("https post --GET_LOCATION-- FAILED !!! : %s\n", https.errorToString(httpCode).c_str());
      }

      https.end();
    }
    else
    {
      Serial.printf("http begin --GET_LOCATION-- FAILED !!! Unable to connect !!!!\n");
    }
  }
  else
  {
    Serial.printf("WiFi not connected --GET_LOCATION-- \n");
  }
}

String getSurroundingWiFiJson()
{
  Serial.print("\n\Scanning Surrounding Wifi...\n");

  String wifiArray = "[";

  int8_t numWifi = WiFi.scanNetworks();
  if (numWifi > MAX_WIFI_SCAN)
  {
    numWifi = MAX_WIFI_SCAN;
  }

  Serial.println(String(numWifi) + " WiFi networks found");
  for (uint8_t i = 0; i < numWifi; i++)
  {
    wifiArray += "{\"macAddress\":\"" + WiFi.BSSIDstr(i) + "\",";
    wifiArray += "\"signalStrength\":" + String(WiFi.RSSI(i)) + ",";
    wifiArray += "\"channel\":" + String(WiFi.channel(i)) + "}";
    if (i < (numWifi - 1))
    {
      wifiArray += ",\n";
    }
  }
  WiFi.scanDelete();
  wifiArray += "]";
  Serial.println("WiFi list :\n" + wifiArray);
  return wifiArray;
}

void GetGoogleCertificate()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    //Object of class HTTPClient
    HTTPClient http;

    Serial.print("\n\nhttp begin --GET_GOOGLE_CERT--:\n");

    if (http.begin(GOOGLE_CERTIFICATE_ROUTE))
    {
      http.addHeader("Content-Type", "application/json"); //Specify content-type header
      Serial.printf("http get --GET_GOOGLE_CERT-- \n");

      // start connection and send HTTP header
      int httpCode = http.GET();

      // httpCode will be negative on error
      if (httpCode > 0)
      {
        // HTTP header has been send and Server response header has been handled
        Serial.printf("http get --GET_GOOGLE_CERT-- SUCCESSFULL ... Code: %d \t payload: %s \n", httpCode, http.getString().c_str());

        String payload = http.getString(); //.c_str() for print ?

        const size_t bufferSize = JSON_ARRAY_SIZE(20) + JSON_OBJECT_SIZE(1) + 100;
        DynamicJsonBuffer jsonBuffer(bufferSize);

        JsonObject &root = jsonBuffer.parseObject(payload);

        JsonArray &googleCert = root["googleCert"];

        if (root.success())
        {
          for (int i = 0; i < 20; i++)
          {
            fingerprint[i] = googleCert[i];
          }
        }
        else
        {
          Serial.println("http get --GET_GOOGLE_CERT-- ERROR IN RESPONSE !!!: Error in deserializing JSON response...");
        }
      }
      else
      {
        Serial.printf("http get --GET_GOOGLE_CERT-- FAILED !!! : %s\n", http.errorToString(httpCode).c_str());
      }

      http.end();
    }
    else
    {
      Serial.printf("http begin --GET_GOOGLE_CERT-- FAILED !!! Unable to connect !!!!\n");
    }
  }
  else
  {
    Serial.printf("WiFi not connected --GET_GOOGLE_CERT-- \n");
  }
}

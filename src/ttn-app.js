import { data, application } from "ttn";

export const startTTN = async () => {
  const appID = "lorawan_test_app";
  const accessKey =
    "ttn-account-v2.ZlWy6HbjIZKLSuYkOANxgaEecltBbOj9l3PcbVgZKTs";

  // discover handler and open mqtt connection
  data(appID, accessKey)
    .then(function(client) {
      client.on("uplink", function(devID, payload) {
        console.log("Received uplink from ", devID);
        console.log(payload);
      });
    })
    .catch(function(err) {
      console.error(err);
      // process.exit(1);
    });

  // discover handler and open application manager client
  application(appID, accessKey)
    .then(function(client) {
      return client.get();
    })
    .then(function(app) {
      console.log("Got app", app);
    })
    .catch(function(err) {
      console.error(err);
      // process.exit(1);
    });
};

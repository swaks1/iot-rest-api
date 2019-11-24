import { startServer } from "./server";
import { startTTN } from "./ttn-app";

var initApp = async () => {
  await startServer();
  await startTTN();
};

initApp();

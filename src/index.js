import { startServer } from "./server";
import { startTTN } from "./ttn-app";
import { startAlertScheduler } from "./alerts-scheduler";

var initApp = async () => {
  await startServer();
  await startTTN();
  await startAlertScheduler();
};

initApp();

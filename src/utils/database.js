import mongoose from "mongoose";
import options from "../config";

export const connectToDatabase = (url = options.dbUrl, opts = {}) => {
  return mongoose.connect(url, {
    ...opts,
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

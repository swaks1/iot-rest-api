// this config will be merged with the default one found in index.js
// if the enviroment was set to development

export const config = {
  logging: true,
  dbUrl: "mongodb://localhost:27017/iotApp",
  secrets: {
    jwt: "learneverything"
  }
};

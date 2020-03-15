// this config will be merged with the default one found in index.js
// if the enviroment was set to produciton

export const config = {
  logging: true,
  dbUrl: process.env.dbUrl,
  secrets: {
    jwt: process.env.secrets_jwt
  },
  ttnAppId: process.env.ttnAppId,
  ttnAccessKey: process.env.ttnAccessKey,
  email: {
    host: process.env.email_host,
    port: process.env.email_port,
    user: process.env.email_user,
    pass: process.env.email_pass,
    from: process.env.email_from,
    to: process.env.email_to
  },
  blynkAccesskey: process.env.blynkAccesskey,
  alertsInterval: process.env.alertsInterval
};

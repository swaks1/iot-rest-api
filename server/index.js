var config = require('./config');
var logger = require('./util/logger');
var api = require('./api');
var mongoCLient = require('mongoose');
var app = require('express')();

//set up mongoose...db.url is different depending on NODE_ENV
mongoCLient.connect(config.db.url, { useNewUrlParser: true });

//set up the middleware
require('./middleware/appMiddleware')(app);

//set up the API
app.use('/api/', api);

// set up global error handling
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send("Oops...Internal Server Error");
});


module.exports = app;
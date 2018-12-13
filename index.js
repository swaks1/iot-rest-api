// intro point for the server.
// if only the folder is specified in require, index.js will be taken inside that folder by default

// setup config first before anything by requiring it
var config = require("./server/config");
var app = require("./server");
var logger = require("./server/util/logger");

app.listen(config.port, () => {
    logger.log(`Listening on http://localhost:${config.port}`);
});


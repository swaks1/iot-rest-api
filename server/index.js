var express = require('express');

var app = express();

app.get("/", (req, res) => {
    res.send("Hello...");
});

module.exports = app;
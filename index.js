var express = require("express");

var app = express();
var port = process.env.port || 3000;

app.get("/", (req, res) => {
    res.send("Welcome to my api");
});

app.listen(port, () => {
    console.log("Running on " + port)
})
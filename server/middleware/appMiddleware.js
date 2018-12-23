var morgan = require('morgan');
var bodyParser = require('body-parser');


// setup global middleware here

module.exports = function (app) {
    app.use(morgan('dev'));

    // //inspect the request before sending to bodyParser.. BUT WILL BREAK THE PIPELINE....
    // app.use(function(req, res, next){
    //     var data = "";
    //     req.on('data', function(chunk){ data += chunk;});
    //     req.on('end', function(){
    //         req.rawBody = data;
    //         console.log(req.rawBody);
    //         next();
    //     });
    //  });

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
};
Babel must be used to transpile Async Await and other Not yet added modules to node JS.


1. In development add this script in package.json
    "dev": "nodemon --exec babel-node src/index.js",
and then "npm run dev" can be used to start the server. babel-node transpiles on the fly
.babelrc_DEV can be added in .babelrc in the root


2. For production first add the scripts in package json
    "build": "babel src --out-dir dist"
    "start": "node dist/index.js"
then "npm run build" to transpile to dist folder and then "npm start" to start the server
.babelrc_PROD MUST be added in .babelrc in the root


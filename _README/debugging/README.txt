Add this in .vscode/launch.json
        {
            "type": "node",
            "request": "attach",
            "name": "Attach to Port",
            "address": "localhost",
            "port": 9229
        }

Add this script in package json

"debug": "nodemon --inspect --watch src --exec node_modules/.bin/babel-node src/index.js",

than run: --> npm run debug
and attach with VSCode debugger to the port that is available from the previous command.



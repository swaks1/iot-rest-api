var gulp = require("gulp"),
    nodmeon = require("gulp-nodemon");

gulp.task('default', () => {
    nodmeon({
        script: "index.js",
        ext: "js",
        env: {
            PORT: 8000
        },
        ignore: ['./node_modules/**']
    })
        .on('restart', () => {
            console.log("Restarting Server...")
        });
});
module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.initConfig({
        jshint: {
            exclude: [ 'js/tip.js' ],
            all: [ 'Gruntfile.js',
                   'js/**/*.js' ]
        },
        watch: {
            files: [ 'Gruntfile.js',
                     'js/**/*.js' ],
            tasks: [ 'jshint' ]
        }
    });
};

/*jshint node:true, strict:false */

module.exports = function(grunt) {
    grunt.config.init({
        pkg: grunt.file.readJSON('package.json'),
        
        browserify: {
            all: {
                files: {
                    'build/bridge.js': [
                        'bridge.js'
                    ]
                }
            }
        },
        
        concat: {
            all: {
                options: {
                    banner: 'var core_require = require'
                },
                
                files: {
                    'build/bridge.js': ['build/bridge.js']
                }
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-browserify');
    
    grunt.registerTask('default', ['browserify', 'concat']);
};

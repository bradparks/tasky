path = require 'path'
module.exports.config =

    files:
        javascripts:
            joinTo:
                'javascripts/app.js': /^app/
                'javascripts/vendor.js': /^vendor/
            order:
                # Files in `vendor` directories are compiled before other files
                # even if they aren't specified in order.
                before: [
                    'vendor/scripts/jquery-1.11.0.js'
                    'vendor/scripts/underscore-1.5.2.js'
                    'vendor/scripts/backbone-1.1.0.js'
                    'vendor/scripts/backbone.babysitter.js'
                    'vendor/scripts/backbone.projections.js'
                ]

        stylesheets:
            joinTo: 'stylesheets/app.css'
            order:
                before: ['vendor/styles/normalize.css']
                after: ['vendor/styles/helpers.css']

        templates:
            defaultExtension: 'jade'
            joinTo: 'javascripts/app.js'

    plugins:
        jade:
            globals: ['t']

        coffeelint:
            pattern: /^app\/.*\.coffee_disable$/
            options:
                indentation:
                    value: 4
                    level: "error"
        uglify:
            mangle: true
            compress:
                global_defs:
                    DEBUG: false

        cleancss:
            keepSpecialComments: 0
            removeEmpty: true

        digest:
            referenceFiles: /\.jade$/

    overrides:
        production:
            optimize: true
            sourceMaps: true
            paths:
                public: path.resolve __dirname, '../build/client/public'


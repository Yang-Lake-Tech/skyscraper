const scssWildCard = '**/*.scss';
const jsAllWildCard = '**/*.js*';
const excludeMinJsWildCard = "!**/*.min.js";
const htmlWildCard = '**/*.html';

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        sass: {
            x1: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/x1-title.css': 'src/movies/JurassicWorldFallenKingdom/x1/styles/title.scss'
                }
            },
            dev: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'src/x1-title.css': 'src/movies/JurassicWorldFallenKingdom/x1/styles/title.scss'
                }
            }
        },

        requirejs: {
            x1: {
                options: {
                    optimize: 'none',
                    mainConfigFile: "src/x1-main.js",
                    include: "x1-main.js",
                    out: "dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/bundle.js"
                }
            }
        },

        clean: {
            start: [
                'dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/*',
                'dist/Code/EPO/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/*'
            ]
        },

        copy: {
            mainAssets: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: ['Assets/**'],
                        dest: 'dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/'
                    }
                ]
            },
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: [
                            'x1-title.css'
                            , 'title_metadata.json'
                            , 'nzjsapi/*'
                            , 'common/js/nativebridge/NativeBridge.js'
                            , '3E5369E0-ACD2-4CEB-9A6E-570D6CDC64AD'
                            , 'DCB9C840-7EA9-4A16-A02D-C4DB8E4B27C6'
                            , 'require.js'
                        ],
                        dest: 'dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/'
                    }
                ],
            },
            index: {
                src: 'src/x1.html',
                dest: 'dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/x1.html',
                options: {
                    process: function (content, srcpath) {
                        return content
                            .replace(
                                '<!-- <script src="bundle.js"></script> -->',
                                '<script src="bundle.js"></script>'
                            )
                            .replace(
                                'data-main="x1-main.js"',
                                ''
                            )

                    }
                }
            },
            EPO: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/',
                        src: ['**'],
                        dest: 'dist/Code/EPO/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/'
                    }
                ]
            }
        },


        hashres: {
            options: {
                renameFiles: true
            },
            prod: {
                src: [
                    'dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/bundle.js',
                    'dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/x1-title.css',
                ],
                dest: 'dist/Code/EST/B2AB2F6B-0A06-EBD7-77CE-A18964E93A76/x1.html'
            }
        },


        watch: {
            files: [
                'src/common/mobile/styles/*.scss',
                'src/common/x1/styles/*.scss',
                'src/movies/JurassicWorldFallenKingdom/x1/styles/*.scss'
            ],
            tasks: ['sass:dev'],
            options: {
                atBegin: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-hashres');

    grunt.registerTask('watch-', [ 'watch' ]);

    grunt.registerTask('build', [
        'clean:start'
        , 'sass:x1'
        , 'requirejs:x1'
        , 'copy:mainAssets'
        , 'copy:main'
        , 'copy:index'
        , 'hashres:prod'
        , 'copy:EPO'
    ]);

    grunt.registerTask('buildNoAssets', [
        'clean:start'
        , 'sass:x1'
        , 'requirejs:x1'
        , 'copy:main'
        , 'copy:index'
        , 'hashres:prod'
        , 'copy:EPO'
    ]);
};
'use strict';

// Day to day tasks are under main tasks (test and full being the main ones)
// You shouldn't need to manually run the helper tasks.
//
// Most of the config is in files. and config.
//
// Main Tasks:
//  test - run model, controller tests with coverage report
//  full - run model, controller, view tests with coverage report
//  view - run browser based end to end tests
//  controller - run controller tests with coverage
//  model - run model tests with coverage
//  integration - run integration tests (No Coverage)
//  clean - clean coverage, node_modules, and bower
//  bower - install bower components
//  travis - currently an alias to full
//  lint - run linters (eslint)
//
// Helper Tasks:
//  bower_install - install all the bower packages
//  bower_inject - add bower dependencies to www/html/index.html
//  coverage_report - generate a coverage report from the saved coverage files
//  model_test - run model tests, capturing coverage data
//  controller_test - run controller tests, copturing coverage data
//  integration_test - run integration tests (no coverage)
//  clean_coverage - clean all the coverage files
//  clean_bower - clean out the bower files
//  clean_modules - clean node_modules
//  view_instrument - compile instrumented versions of the view files
//  view_test - run the view tests
//  test_server - start the test server
//  stop_test_server - stop the test server
//

// NODE_ENV matters for these (espeically the view tests)
// config files are selected based on the env, and we need
// to point to a different location for the web js files

var gulp = require('gulp');
var lazypipe = require('lazypipe');
var del = require('del');
var wiredep = require('wiredep').stream;
var webpack = require('webpack-stream');
var HtmlWebpackPlugin = require('html-webpack-plugin');

// Load all of the gulp-* modules listed in package.json into
// plugins.*  I nomrally don't like this type of obfuscation
// but the plugin list was getting out of control
var plugins = require('gulp-load-plugins')({DEBUG: false});

// Holds the testServer object from gulp-live-server
var testServer = {};

// various file sets used below
var files = {
  modelFiles: ['lib/model/**/*.js'],
  viewFiles: ['www/js/**/*.js'],
  controllerFiles: ['lib/controller/**/*.js'],
  utilFiles: ['lib/util/**/*.js'],
  jsxFiles: ['www/jsx/**/*.jsx'],

  modelTestFiles: ['test/model/**/*.js'],
  viewTestFiles: ['test/view/**/*.js'],
  controllerTestFiles: ['test/controller/**/*.js'],

  allSrc: ['www/jsx/**/*.jsx', 'www/js/**/*.js', 'lib/**/*.js',
           'bin/flowTrack.js', 'test/**/*.js', 'gulpfile.js'],

  integrationTestFiles: ['test/integration/**/*.js'],

  coverageFiles: ['coverage/**/coverage*.json'],
  instrumentedFiles: 'coverage/www/test_files',
  buildDest: 'dist'
};

// Configuration settings for various tasks / processes
var config = {
  mocha: {
    reporter: 'spec',
    ui: 'mocha-retry'
  },
  istanbul: {
    includeUntested: true
  },
  istanbulInstrument: {
    includeUntested: true,
    coverageVariable: '__coverage__flowTrack2__'
  },
  istanbulReport: {
    reporters: ['lcov', 'text']
  },
  modelCoverage: {
    reporters: ['json'],
    reportOpts: {
      json: {
        dir: 'coverage',
        file: 'coverage-model.json'
      }
    }
  },
  controllerCoverage: {
    reporters: ['json'],
    reportOpts: {
      json: {
        dir: 'coverage',
        file: 'coverage-controller.json'
      }
    }
  },
  protractor: {
    configFile: 'test/view/protractor.conf.js'
  },
  testServer: {
    env: {
      NODE_ENV: 'viewTest'
    }
  },
  JSX: {
    module: {
      loaders: [
        {test: /\.jsx$/, loader: 'babel-loader'}
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'www/html/index2.html',
        inject: 'body'
      })
    ]
  }
};

// Define some pipe fragments
var mochaTask = lazypipe()
  .pipe(plugins.mocha, config.mocha);

var istanbulPre = lazypipe()
  .pipe(plugins.istanbul, config.istanbul)
  .pipe(plugins.istanbul.hookRequire);

var istanbulWriteReport = lazypipe()
  .pipe(plugins.istanbulReport, config.istanbulReport);

var istanbulInstrument = lazypipe()
  .pipe(plugins.istanbul, config.istanbulInstrument);

//
// Main tasks
//

gulp.task('default', ['test']);
// run all but the view tests
gulp.task('test', function(cb) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'controllerTest';
  plugins.sequence('lint', 'clean_coverage', 'controller_test', 'model_test',
      'integration_test', 'coverage_report')(cb);
});

gulp.task('build', ['build_jsx']);

// Run all tests
gulp.task('full', function(cb) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'viewTest';
  plugins.sequence('lint', 'test_server', 'clean_coverage',
                   'controller_test', 'integration_test', 'model_test',
                   'view_instrument', 'view_test', 'stop_test_server',
                    'coverage_report')(cb);
});

// Run the view tests.  These interact with a browser
gulp.task('view', function(cb) {
  plugins.sequence('lint', 'test_server', 'clean_coverage', ['view_instrument',
                   'view_test'], 'stop_test_server', 'coverage_report')(cb);
});

gulp.task('controller', function(cb) {
  plugins.sequence('lint', 'clean_coverage', 'controller_test',
    'coverage_report')(cb);
});

// Run the model tests
gulp.task('model', function(cb) {
  plugins.sequence('lint', 'clean_coverage', 'model_test',
    'coverage_report')(cb);
});

// Run the integration tests  needs to have ES running
gulp.task('integration', function(cb) {
  // NODE_ENV is set in integration_test because
  // we need to ensure we have a seperate DB for the
  // integration tests
  plugins.sequence('lint', 'integration_test')(cb);
});

// Download, install, and inject bower components
gulp.task('bower', function(cb) {
  plugins.sequence('bower_install', 'bower_inject')(cb);
});

// Delete data files and modules
gulp.task('clean', ['clean_bower', 'clean_modules', 'clean_coverage',
  'clean_dist']);

// This task gets run by travis-ci
gulp.task('travis', ['full']);

// Run linters across all src files
gulp.task('lint', function() {
  return gulp.src(files.allSrc)
      .pipe(plugins.eslint())
      .pipe(plugins.eslint.format());
});

gulp.task('watch', function(cb) {
  gulp.watch(files.controllerFiles, ['controller']);
  gulp.watch(files.modelFiles, ['model']);
  gulp.watch(files.viewFiles, ['view']);
  cb();
});

gulp.task('build_jsx', function(cb) {
  gulp.src(files.jsxFiles)
        .pipe(webpack(config.JSX))
        .pipe(gulp.dest(files.buildDest + '/jsx'));

  cb();
});

//
// Support tasks
//

// Generate a merged coverage report on any reports available
gulp.task('coverage_report', function() {
  gulp.src(files.coverageFiles)
    .pipe(istanbulWriteReport())
      .on('error', function(error) {
        plugins.util.log(error.message);
      });
});

// run model tests and collect coverage data
gulp.task('model_test', function(cb) {
  process.env.NODE_ENV = 'modelTest';
  coverageTest(files.modelFiles, files.modelTestFiles,
    config.modelCoverage, cb);
});

// test the server functions and collect coverage data
gulp.task('controller_test', function(cb) {
  process.env.NODE_ENV = 'controllerTest';
  coverageTest(files.controllerFiles, files.controllerTestFiles,
    config.controllerCoverage, cb);
});

gulp.task('integration_test', function(cb) {
  // integration test needs to be forced here
  process.env.NODE_ENV = 'integrationTest';
  gulp.src(files.integrationTestFiles)
    .pipe(mochaTask())
    .on('end', cb);
});

// install the bower packages
gulp.task('bower_install', function(cb) {
  plugins.bower()
      .pipe(gulp.dest('www/bower_components'))
        .on('end', function() {
          del('bower_components');
          cb();
        });
});

// add bower installed packages to the html
gulp.task('bower_inject', function() {
  gulp.src('./www/html/index.html')
        .pipe(wiredep({
          directory: 'www/bower_components'
        }))
        .pipe(gulp.dest('./www/html'));
});

// instrument the files for view testing
gulp.task('view_instrument', function(cb) {
  gulp.src(files.viewFiles)
    .pipe(istanbulInstrument())
    .pipe(gulp.dest(files.instrumentedFiles))
    .on('end', cb);
});

// run the actual e2e test
gulp.task('view_test', function(cb) {
  process.env.NODE_ENV = 'viewTest';
  gulp.src(files.viewTestFiles)
    .pipe(plugins.protractor.protractor(config.protractor))
    .on('end', cb);
});

//
// Cleaners
//
gulp.task('clean_coverage', function(cb) {
  del.sync('coverage');
  cb();
});

gulp.task('clean_modules', function(cb) {
  del.sync('node_modules');
  cb();
});

gulp.task('clean_dist', function(cb) {
  del.sync('dist/*');
  cb();
});

gulp.task('clean_bower', function(cb) {
  del.sync('www/bower_components');
  cb();
});

gulp.task('test_server', function(cb) {
  testServer = plugins.liveServer('bin/flowTrack', config.testServer, false);
  testServer.start();
  cb();
});

gulp.task('stop_test_server', function(cb) {
  testServer.stop();
  cb();
});

//
// testing and reporting "drivers"
//

/**
 * coverageTest - template to run coverage tests on a set of files
 *
 * @param {array} srcFiles       list of source files under test
 * @param {array} testFiles      the list of tests
 * @param {obj} coverageConfig config object for istanbul
 * @param {function} cb             callback to use when done
 *
 */
function coverageTest(srcFiles, testFiles, coverageConfig, cb) {
  var istanbul = lazypipe()
    .pipe(plugins.istanbul.writeReports, coverageConfig);

  gulp.src(srcFiles)
    .pipe(istanbulPre())
      .on('end', function() {
        gulp.src(testFiles)
          .pipe(mochaTask())
          .pipe(istanbul())
          .on('end', cb);
      });
}

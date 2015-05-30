/* jshint unused: false, expr: true*/
'use strict';



var bunyan = require('bunyan');
var chai = require('chai');
var expect = chai.expect;
var GetLogger = require('../lib/GetLogger');


describe('GetLogger', function() {

    it('should return a bunyan object', function() {
        var logger = new GetLogger();

        expect(logger).to.be.instanceof(bunyan);

    });

    it('should be configured to only log fatals under test', function() {
        var logger = new GetLogger('test');

        expect(logger).to.have.property('_level').that.equals(60);
    });

    it('should be configured to only log debug under dev', function() {
        var logger = new GetLogger('dev');

        expect(logger).to.have.property('_level').that.equals(20);
    });

    it('should be configured to only log info by default', function() {
        var logger = new GetLogger();

        expect(logger).to.have.property('_level').that.equals(30);
    });


});
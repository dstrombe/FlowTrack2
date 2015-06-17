/* jshint expr: true */
'use strict';

var JsonRouteHandlers = require('../../../lib/WebService/JsonRouteHandlers');
var FlowTrack2App = require('../../../lib/FlowTrack2App');
var GetLogger = require('../../../lib/GetLogger');


var es = require('elasticsearch');
var config = require('config');
var express = require('express');

var request = require('supertest');
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;




describe('JsonRoutes', function() {
    describe('/json/rawFlowsForlast/:duration/:scale', function() {

        it('should call getFlowsForLast and execute the callback', function(done) {

            var logger = new GetLogger('test', 'TestLogger');
            var app = express();

            // var jsonHandler = new JsonRouteHandlers(es, logger, config);

            var getFlowsForLastStub = sinon.stub();

            var jsonHandler = {};

            jsonHandler.getFlowsForLast = getFlowsForLastStub.yields('', 'test', '');


            // Load 
            require('../../../lib/WebService/JsonRoutes')(app, config, jsonHandler);

            request(app)
                .get('/json/rawFlowsForLast/1/second')
                .expect('"test"')
                .end(function(err, res) {
                    expect(err).to.be.null;
                    expect(getFlowsForLastStub).to.be.calledOnce;
                    done();
                });
        });
    });
});
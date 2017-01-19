'use strict';
const fn = require('FUNCTION_NAME'); //eslint-disable-line no-undef

const awsServerlessExpress = require('aws-serverless-express');
const server = awsServerlessExpress.createServer(fn);

exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);


#!/usr/bin/env node
/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const archiver = require('archiver');
const Readable = require('stream').Readable;
const through2 = require('through2');
const streamBfs = require('stream-buffers');
const aws = require('aws-sdk');
const fnNames = new Readable;
const handlerFileContent = fs.readFileSync(`${__dirname}/lib/awsLambdaHandler.js`, 'utf8');

function main() {
  const config = getConfig();

  aws.config.update({
    region: config.aws.region
  });

  const lambda = new aws.Lambda({
    apiVersion: '2015-03-31'
  });

  fnNames.pipe(through2.obj(function (chunk, encoding, cb) {
    const fnName = chunk.toString('utf8');
    const archive = archiver('zip');
    const bfStream = new streamBfs.WritableStreamBuffer();

    if (!fs.existsSync(`${__dirname}/lib/${fnName}.js`)) {
      throw new Error(`${fnName}.js file not found`);
    }

    bfStream.on('error', cb);
    bfStream.on('finish', () => {
      this.push({ fnName: fnName, buffer: bfStream.getContents() });
    cb();
  });

    archive.on('error', cb);

    archive.pipe(bfStream);
    archive.append(handlerFileContent.replace(/FUNCTION_NAME/, fnName), {
      name: 'index.js'
    });
    archive.bulk([
      {
        expand: true,
        cwd: `${__dirname}/tmp`,
        src: [ '*.js', 'node_modules/**', 'public/**' ]
      }
    ]);
    archive.finalize();
  }))
      .pipe(through2.obj(function (chunk, encoding, cb) {
        lambda.updateFunctionCode({
          FunctionName: `${chunk.fnName}`,
          ZipFile: chunk.buffer
        }, (err, data) => {
          if (err) {
            return cb(err);
          }

          console.log(`Lambda function with name "${data.FunctionName}" was deployed successfully.`);
        cb();
      });
      }));

  ['website']
      .forEach(fnName => fnNames.push(fnName));
  fnNames.push(null);
}

function getConfig() {
  return {
    aws: {
      region: process.env.AWS_REGION || 'ap-southeast-2'
    }
  };
}

main();

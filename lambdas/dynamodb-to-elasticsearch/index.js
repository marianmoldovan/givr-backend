'use strict';

const AWS = require('aws-sdk');
const path = require('path');
const dynamoDoc = require('dynamo-doc');
const hasha = require('hasha');

const esDomain = {
    region: process.env.region,
    endpoint: process.env.endpoint,
    index: process.env.index,
    doctype: process.env.doctype
};

const endpoint = new AWS.Endpoint(esDomain.endpoint);
const creds = new AWS.EnvironmentCredentials('AWS');

exports.handler = (event, context, callback) => {
    event.Records.forEach((record) => {
      if(record.eventName == 'REMOVE'){
        dynamoDoc.dynamoToJs(record.dynamodb.OldImage, function(err, json) {
          if (err) callback(err)
          else deleteToES(json, callback);
        });
      }
      else if(record.eventName == 'INSERT' || record.eventName == 'MODIFY'){
        dynamoDoc.dynamoToJs(record.dynamodb.NewImage, function(err, json) {
          if (err) callback(err)
          else postToES(json, callback);
        });
      }
    });
};

function postToES(doc, callback) {
    var req = new AWS.HttpRequest(endpoint);

    var objectId = hasha(doc.user + doc.created);

    req.method = 'POST';
    req.path = path.join('/', esDomain.index, esDomain.doctype, objectId);
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = JSON.stringify(doc);

    executeRequest(req, callback);
}

function deleteToES(doc, callback) {
    var req = new AWS.HttpRequest(endpoint);

    var objectId = hasha(doc.user + doc.created);

    req.method = 'DELETE';
    req.path = path.join('/', esDomain.index, esDomain.doctype, objectId);
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;

    executeRequest(req, callback);
}

function executeRequest(req, callback) {
  var signer = new AWS.Signers.V4(req , 'es');  // es: service code
  signer.addAuthorization(creds, new Date());

  var send = new AWS.NodeHttpClient();
  send.handleRequest(req, null, function(httpResp) {
      var respBody = '';
      httpResp.on('data', function (chunk) {
          respBody += chunk;
      });
      httpResp.on('end', function (chunk) {
          console.log('Response: ' + respBody);
          callback(null, 'Lambda added document ' + req.body);
      });
  }, function(err) {
      console.log('Error: ' + err);
      callback('Lambda failed with error ' + err);
  });
}

'use strict';
// TODO: Please add , {authorizationType: 'AWS_IAM'}  when finished...
const ApiBuilder = require('claudia-api-builder'),
    api = new ApiBuilder(),
    Promise = require('bluebird'),
    aws = require('aws-sdk'),
    doc = require('dynamodb-doc'),
    _ = require('lodash');

const docClient = Promise.promisifyAll(new doc.DynamoDB());

module.exports = api;

api.get('/campaign/status', function(request) {
  var params = {
    TableName: getTableName(),
  };
  return docClient.describeTableAsync(params);
});

api.get('/campaign', function(request) {
  var params = {
    TableName: getTableName(),
    Key: {
      user: request.queryString.user,
      created: parseInt(request.queryString.created)
    }
  };
  return docClient.getItemAsync(params);
});

api.post('/campaign', function(request) {
  var requiredKeys = ['user', 'location', 'title', 'description', 'items'];
  if(!_.every(requiredKeys, _.partial(_.has, request.body)))
    return new api.ApiResponse({errorMessage: 'Missing parameters'}, {'Content-Type': 'application/json'}, 400);
  var params = {
    TableName: getTableName(),
    Item: request.body
  };
  params.Item.created = new Date().getTime();
  return docClient.putItemAsync(params);
}, { success: 201 });

api.put('/campaign', function(request) {
  var params = {
    TableName: getTableName(),
    Key: {
      user: request.queryString.user,
      created: parseInt(request.queryString.created)
    },
    AttributeUpdates: {}
  };
  Object.keys(request.body).forEach(function (key) {
    params.AttributeUpdates[key] = {Action: 'PUT', Value: request.body[key]}
  });
  return docClient.updateItemAsync(params);
});

function getTableName() {
    return process.env.Tablename || 'givr-campaigns';
};
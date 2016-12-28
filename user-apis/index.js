'use strict';
// TODO: Please add , {authorizationType: 'AWS_IAM'}  when finished...
const ApiBuilder = require('claudia-api-builder'),
    api = new ApiBuilder(),
    Promise = require('bluebird'),
    aws = require('aws-sdk'),
    doc = require('dynamodb-doc');

const docClient = Promise.promisifyAll(new doc.DynamoDB());

module.exports = api;

api.get('/user/status', function(request) {
  var params = {
    TableName: getTableName(),
  };
  return docClient.describeTableAsync(params);
});

api.get('/user', function(request) {
  var params = {
    TableName: getTableName(),
    Key: {
      user: request.queryString.user
    }
  };
  return docClient.getItemAsync(params);
});

api.get('/user/find', function(request) {
  var params = {
    TableName: getTableName(),
    ExpressionAttributeValues : {}
  };

  Object.keys(request.queryString).forEach(function(key, index){
    if(index > 0)
      params.FilterExpression = params.FilterExpression + ' and ' + key + ' = :value' + index;
    else params.FilterExpression = key + ' = :value' + index;
    params.ExpressionAttributeValues[':value' + index] = request.queryString[key];
  });
  return docClient.scanAsync(params);
});

api.put('/user', function(request) {
  var params = {
    TableName: getTableName(),
    Key: {
      user: request.queryString.user
    },
    AttributeUpdates: {}
  };
  Object.keys(request.body).forEach(function (key) {
    params.AttributeUpdates[key] = {Action: 'PUT', Value: request.body[key]}
  });
  return docClient.updateItemAsync(params);
});

function getTableName() {
    return process.env.Tablename || 'givr-users';
};

'use strict';

const AWS = require('aws-sdk');
const path = require('path');
const Promise = require('bluebird');
const staticQueries = require('./staticQueries');

const esDomain = {
    region: 'eu-west-1',
    endpoint: 'search-givr-s6kq74ffvvmx3ttlombzv47eju.eu-west-1.es.amazonaws.com',
    index: 'givr',
    doctype: 'campaigns'
};

const endpoint = new AWS.Endpoint(esDomain.endpoint);
const creds = new AWS.EnvironmentCredentials('AWS');

module.exports.near = function(queryString) {
  return new Promise(function(resolve, reject) {
    getNear(queryString.lat, queryString.lon).then(function(result){
      resolve(JSON.parse(result).hits.hits.map(function(item){
        var itemObject = Object.assign({}, item._source);
        itemObject.distance = item.sort[0];
        return itemObject;
      }));
    }).catch(reject);
  });
}

module.exports.find = function(queryString) {
  return new Promise(function(resolve, reject) {
    findAndGetNear(queryString.lat, queryString.lon, queryString.query).then(function(result){
      resolve(JSON.parse(result).hits.hits.map(function(item){
        var itemObject = Object.assign({}, item._source);
        itemObject.distance = item.sort[0];
        return itemObject;
      }));
    }).catch(reject);
  });
}

function findAndGetNear(lat, lon, query) {
  return new Promise(function(resolve, reject) {
    var queryBody = Object.assign({}, staticQueries.searchAndFindNearQuery);
    queryBody.sort[0]._geo_distance.location.lat = lat;
    queryBody.sort[0]._geo_distance.location.lon = lon;
    queryBody.query.multi_match.query = query;
    executeRequest(queryBody).then(resolve).catch(reject);
  });
}

function getNear(lat, lon) {
  return new Promise(function(resolve, reject) {
    var queryBody = Object.assign({}, staticQueries.searchNearQuery);
    queryBody.sort[0]._geo_distance.location.lat = lat;
    queryBody.sort[0]._geo_distance.location.lon = lon;
    executeRequest(queryBody).then(resolve).catch(reject);
  });
}

function executeRequest(queryBody) {
  return new Promise(function(resolve, reject) {

    var req = new AWS.HttpRequest(endpoint);

    req.method = 'POST';
    req.path = path.join('/', esDomain.index, esDomain.doctype, '_search');
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = JSON.stringify(queryBody);

    console.log('Query', queryBody);

    var signer = new AWS.Signers.V4(req , 'es');
    signer.addAuthorization(creds, new Date());

    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, function(httpResp) {
        var respBody = '';
        httpResp.on('data', function (chunk) {
          respBody += chunk;
        });
        httpResp.on('end', function (chunk) {
          resolve(respBody);
        });
    }, reject);
  });
}

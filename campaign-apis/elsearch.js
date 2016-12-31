'use strict';

const AWS = require('aws-sdk');
const path = require('path');
const Promise = require('bluebird');

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

const searchNearQuery = {
  'query': {
    'match_all': {
    }
  },
  'sort': [
    {
      '_geo_distance': {
        'location': {
          'lat': 40.438253,
          'lon': -3.6995181
        },
        'order': 'asc',
        'unit':  'm',
        'mode' : 'min'
      },
      'created': { 'order': 'desc', 'mode':  'min'}
    }
  ]
};

function getNear(lat, lon) {
  return new Promise(function(resolve, reject) {
    var queryBody = Object.assign({}, searchNearQuery);
    queryBody.sort[0]._geo_distance.location.lat = lat;
    queryBody.sort[0]._geo_distance.location.lon = lon;

    var req = new AWS.HttpRequest(endpoint);

    req.method = 'POST';
    req.path = path.join('/', esDomain.index, esDomain.doctype, '_search');
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = JSON.stringify(queryBody);

    executeRequest(req).then(resolve).catch(reject);
  });
}

function executeRequest(req) {
  return new Promise(function(resolve, reject) {
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

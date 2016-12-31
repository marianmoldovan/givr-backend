'use strict';

module.exports.searchNearQuery = {
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

module.exports.searchAndFindNearQuery = {
  'query': {
    'multi_match' : {
      'query':    'love',
      'fields': [ 'title', '*name','description', 'items']
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

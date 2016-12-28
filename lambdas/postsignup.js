'use strict';

console.log('Loading function');

const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();

exports.handler = (event, context, callback) => {
  var payload = {};

  payload.TableName = process.env.Tablename || 'givr-users';
  payload.Item = {
      user: event.request.userAttributes.email,
      email: event.request.userAttributes.email,
      email_verified: event.request.userAttributes.email,
      given_name: event.request.userAttributes.given_name,
      'cognito:user_status': event.request.userAttributes['cognito:user_status'],
      context: event.callerContext
  };

  console.log('Puting data', payload);
  // When done inserting user in db, contiune auth flow
  dynamo.putItem(payload, function(err, data){
      context.done(null, event);
  });
};

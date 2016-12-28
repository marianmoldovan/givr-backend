'use strict';

// Lambda function to confirm all users when not using email/phone confirmation
exports.handler = function(event, context) {
    event.response.autoConfirmUser = true;
    context.done(null, event);
};

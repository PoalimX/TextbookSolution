'use strict';

const Account = require('./account');

function getCognitoUser(event, context) {
  if (!event.requestContext.authorizer) {
    console.log("error in auth");
    return null;
  }

  // Because we're using a Cognito User Pools authorizer, all of the claims
  // included in the authentication token are provided in the request context.
  // This includes the username as well as other attributes.
  var callingUsername = event.requestContext.authorizer.claims['cognito:username'];

  console.log("getCognitoUser=" + callingUsername);
  return callingUsername;

}

function buildReturnJSON(status, body) {
  return {
    statusCode: status,
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
    },
    body: body
  };
}
module.exports.hello = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

module.exports.getaccountbalance = async (event, context) => {
  var username = getCognitoUser(event, context);
  var balance = await Account.get_balance_for_user(username);

  return buildReturnJSON(
    200,
    JSON.stringify({
      input: event,
      username: username,
      CurrentBalance: balance,
    })
  );
};

module.exports.ensureuserexists = async (event, context) => {
  var username = getCognitoUser(event, context);
  var account = await Account.ensure_account_exists(username);

  if (account == null) {
    return buildReturnJSON(
      500,
      JSON.stringify({
        input: event,
        username: username,
        msg: "could not ensure user exists"
      })
    )
  } else {
    return buildReturnJSON(
      200,
      JSON.stringify({
        input: event,
        username: username,
      })
    );
  }
};

module.exports.transfermoney = async (event, context) => {
  try {
  var httpCode = 200;
  var message = '';
  var currentUsername = getCognitoUser(event, context);
  console.log('currentUsername', currentUsername);
  var currentAccount = await Account.ensure_account_exists(currentUsername);
  console.log('currentAccount', currentAccount);

  var body = JSON.parse(event.body);
  console.log('body', body);

  var transferUsername = body.username;
  console.log('transferUsername', transferUsername);

  var transferSum = body.sum;
  console.log('transferSum', transferSum);

  await Account.ensure_account_exists(transferUsername);
  var currentBalance = await Account.get_balance_for_user(currentUsername);
  if (currentBalance < transferSum) {
    httpCode = 203;
    message = 'Inficient Funds';
  }

  var data = {
    message: message
  }
  // console.log('transfermoney body', body);
  return buildReturnJSON(
    httpCode,
    JSON.stringify(data)
  );
  }
  catch(error) {
    console.log('error transfermoney', error);
  }
};

module.exports.getAllUsers = async (event, context) => {
  // var users = Account.getAllUsers();
  return buildReturnJSON(
    200,
    JSON.stringify({
      users: 'users',
    })
  );
};
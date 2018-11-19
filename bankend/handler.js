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
    if (!await Account.userExists(currentUsername)) {
      httpCode === 203;
      message = `Current user ${currentUsername} doesn't exist`;
    } else {
      var body = JSON.parse(event.body);
      var transferUsername = body.username;
      var transferSum = parseInt(body.sum,10);
      if (!await Account.userExists(transferUsername)) {
        httpCode === 203;
        message = `Transfer user ${transferUsername} doesn't exist`;
      } else {
        var currentBalance = parseInt(await Account.get_balance_for_user(currentUsername),10);
        if (currentBalance < transferSum) {
          httpCode = 203;
          message = 'Inficient Funds';
        }
        else {
          var currentBalanceReceiver = parseInt(await Account.get_balance_for_user(transferUsername),10);
          console.log('currentBalanceReceiver', currentBalanceReceiver);
          var newBalanceReceiver = currentBalanceReceiver + transferSum;
          console.log('newBalanceReceiver', newBalanceReceiver);
          var newBalanceSender = currentBalance - transferSum;
          console.log('newBalanceSender', newBalanceSender);
          var successfullTransfer = await Account.setBalanceByUser(transferUsername, newBalanceReceiver);
          if (successfullTransfer) {
            console.log('successfullTransfer = true');
            var successfullSubtractionOfFunds = await Account.setBalanceByUser(currentUsername, newBalanceSender);
            console.log('successfullSubtractionOfFunds',successfullSubtractionOfFunds );
          } 
          else {
            console.log('successfullTransfer = false');
          }
        }
      }
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
  catch (error) {
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
var hooks = require('hooks');

var guestTokenStash = {},
    userTokenStash  = {};

/**
* Remove trailing slash for text/plain responses
*/

hooks.beforeEach(function(transaction) {
  if (transaction.expected.headers['Content-Type'] === 'text/plain' ||
      transaction.expected.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
    transaction.expected.body = transaction.expected.body.replace(/^\s+|\s+$/g, "");
  }
});

/**
* Console app API section
*/

hooks.after('Console App > Authentication > Retrieve token', function(transaction) {
  var parsedBody = JSON.parse(transaction.real.body);
  userTokenStash.token = parsedBody[0].tokens[0].token;
  userTokenStash.guid = parsedBody[0].guid;
});

hooks.beforeEach(function(transaction) {
  if (userTokenStash.token !== undefined && userTokenStash.guid !== undefined) {
    transaction.request.headers['x-auth-user'] = 'user/' + userTokenStash.guid;
    transaction.request.headers['x-auth-token'] = userTokenStash.token;
  }
});

hooks.before('Console App > Registration > Create user', function (transaction) {
  transaction.request.headers['x-auth-user'] = 'inviteCode';
  transaction.request.headers['x-auth-token'] = 'register';
});

/**
* Player API Section
*/

function guestTokenCb(transaction) {
  if(guestTokenStash['token'] != undefined && guestTokenStash['guid'] != undefined){
    transaction.request.headers['x-auth-user'] = "token/" + guestTokenStash['guid'];
    transaction.request.headers['x-auth-token'] = guestTokenStash['token'];
  }
}

// hook to retrieve session on a login for player API
hooks.after('Beta Player > Authentication > Retrieve Token > Example 1', function (transaction) {
  var parsedBody = JSON.parse(transaction.real.body);
  guestTokenStash.guid = parsedBody.token.guid;
  guestTokenStash.token = parsedBody.token.token;
});

//hook to set the session cookie in all following requests
hooks.before('Beta Player > Authentication > Retrieve Token > Example 2', guestTokenCb);
hooks.before('Beta Player > Authentication > Retrieve Token > Example 3', guestTokenCb);
hooks.before('Beta Player > Player Meta Data > Retrieve Streaming Information', guestTokenCb);
hooks.before('Beta Player > Guardian Audio Files API > Retrieve Audio File Meta Data', guestTokenCb);
hooks.before('Beta Player > Guardian Audio Files Analytics API > Retrieve Window Classifications', guestTokenCb);
hooks.before('Beta Player > Guardian Audio Files Analytics API > Classify Windows', guestTokenCb);
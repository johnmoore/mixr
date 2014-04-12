// FB.init({appId: '547602621990585', xfbml: true, cookie: true, oauth: true});

FB.provide('', {
  'setAccessToken': function(a) {
    this._authResponse = { 'CAAHyCqvDBrkBAF0yXSCLZCZBZBybDYPZA9n2D8ZAQSWC2zMP8FZCeQQsLD0RZCHHe1cXTnENNZAsXDj5LolQwLyjSSR0ZCXqiUxlXA7zgYr5O5ZB6RyvZB0Gs9PoJqT0RXVG3WZAuNZAnnhOYlmpGTVvElRk0CK8fKxKjtW0FVtSusQkmdDXUG9Jujyly6gD5CsKdOw9nIpkbKOXZClg40ihXntdDSP81kFXLWbXFpvtXGlu4jTgZDZD': a };
  }
});
// Usage
FB.setAccessToken('my_access_token');

FB.getLoginStatus(function(response) {

  if (response.authResponse) {
    token = response.authResponse.accessToken;
    FB.api('/me', function(response) {
        console.log(response);
         // do something here they are logged in and have given you perms   
    });
  } else {
    // no user session available, someone you dont know
  }
});

var statuses = FB.api('/me/statuses');

for (var i = 0; i < statuses['data'].length; i++){

    var status = statuses['data'][i];

    for (var j = 0; j < status['likes']['data'].length; j++) {
        var likesData = status['likes']['data'][j];
        var frid = likesData['id']; 
        var frname = likesData['name']; 
        console.log(frname+"    "+frid);
    }

    for (var j = 0; j < status['comments']['data'].length; j++){
        var comArray = status['comments']['data'][j];
        // processing comments array for calculating fanbase
        var frid = comArray['from']['id'];
        var frname = comArray['from']['name'];
        console.log(frname+"    "+frid);
    }
}
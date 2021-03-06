(function() {
  "use strict";

  var https   = require('https'),
      qsparse = require('querystring'),
      async   = require('async'),

      app_id, app_sec, uname,
      fb_host = 'graph.facebook.com'
  ;

  var get = function _get( options, cb ) {
    var req = https.get( options, function( res ) {
      var retarr = [];
      res.on( 'data', function( chunk ) { retarr.push( chunk ); });
      res.on( 'end', function() {
        if( res.statusCode !== 200 ) {
          return cb( 'Request failed with error (' + res.statusCode + ') ' );
        }
        
        var retval = retarr.join('');
        cb( null, retval );
      });
    });
    req.on( 'error', function( err  ) {
      cb( err );
    });
  };

  var getAppAccessToken = function get_app_access_token( cb ) {
    var qs = 'client_id='      + app_id
           + '&client_secret=' + app_sec
           + '&grant_type=client_credentials'
           ;
    var opts = {
      hostname : fb_host,
      path     : '/oauth/access_token?' + qs
    };

    get( opts, function( err, retval ) {
      if( err ) { return cb( 'Could not get app access token: ' + err ) }

      var params = qsparse.parse( retval );
      var token  = params.access_token;

      if( ! token ) { return cb( 'No access token: ' + params ) }

      cb( null, token );
    });
  };

  var makeTestUser = function make_test_user( token, cb ) {
    var qs = 'name='          + encodeURI(uname)
           + '&access_token=' + token
           + "&method=post"
           ;
    var opts = {
      hostname : fb_host,
      path     : '/' + app_id + '/accounts/test-users?' + qs
    };

    get( opts, function( err, retval ) {
      if( err ) { return cb( 'Could not get create test user: ' + err ) }

      var data = JSON.parse(retval);
      cb( null, data );
    });
  };

  exports.generateUser = function(options, cb){
    app_id  = options.app_id;
    app_sec = options.app_sec;
    uname   = options.uname;
    async.waterfall(
      [
        getAppAccessToken,
        makeTestUser
      ],
      function( err, data ) {
        if( err ) { return cb(err); }

        if(!data) {
          return cb({msg: "Unexpected return", data: data});
        }

        cb(null, {
          login_url: data.login_url,
          access_token: data.access_token,
          fb_id: data.id
        });
        /*console.log('Login URL : ', the_one.login_url);
        console.log('Token     : ', the_one.access_token);
        console.log('FB UserID : ', the_one.id);*/
    });
  };

}());

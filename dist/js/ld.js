


/*
 * Author: Abdullah A Almsaeed
 * Date: 4 Jan 2014
 * Description:
 *      This is a demo file used only for the main dashboard (index.html)
 **/
var view;
$(function () {


  view = new Vue({
    el: '#app',
    data: {
      app: {
        namebold : 'Solid',
        name : 'Live',
        logo : ''
      },
      leftbar: {
        'dashboard' : false,
        'elements' : false,
        'forms' : false,
        'widgets' : false,
        'layoutoptions' : false,
        'tables' : false,
        'charts' : false,
        'calendar' : false,
        'examples' : false,
        'multilevel' : false,
        'documentation' : false,
        'labels' : false,
        'inbox' : true
      },
      topbar: {
        'tasks' : false,
        'notifications' : false,
        'messages' : true
      },
      user: {
        '@id' : 'https://melvincarvalho.com/#me',
        name: 'Login',
        avatar: "dist/img/avatar6.png",
        role: 'Web Developer',
        since: 'Nov. 2008',
        status: 'Online',
        loggedIn : false
      },
      rightbar: {
        'layout': true,
        'activity': false,
        'settings': false
      },
      widgets: {
        'dashboard': true,
        'summary': {
          work : 0,
          tidy: 0
        },
        'work': false,
        'chat': false,
        'todo': false,
        'inbox': false,
        'location': false,
        'performance': false,
        'calendar': false
      },
      inbox: {
        unread: 0
      }
    }
  })

  function getParameterByName(name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  var kb, g, f;

  $(function () {
    var wallets = [];

    // $rdf is exported as a global when you load RDFLib, above
    var solid = require('solid');

    $('#login').on('click', function() {
      solid.login().then(function(webid){
        // authentication succeeded; do something with the WebID string
        console.log(webid);
        view.user.loggedIn = true;
        userURI = webid;
        populateUser(webid);
      }).catch(function(err) {
        // authentication failed; display some error message
        console.log(err)
      })

    })


    /**
    * init RDF knowledge base
    */
    var initRDF = function() {
      var PROXY = "https://data.fm/proxy?uri={uri}";

      //var AUTH_PROXY = "https://rww.io/auth-proxy?uri=";
      var TIMEOUT = 60000;
      $rdf.Fetcher.crossSiteProxyTemplate=PROXY;

      g = $rdf.graph();
      f = $rdf.fetcher(g, TIMEOUT);
    };


    console.log('solid.js version: ' + solid.meta.version())


    var workURI, choresURI;
    var CURR  = $rdf.Namespace("https://w3id.org/cc#");
    var FOAF  = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
    var RDFS  = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");


    var userURI = getParameterByName('profile');

    if (!userURI) return;
    populateUser(userURI);
    fetchWallets();


    function fetchWallets() {
      initRDF();

      f.nowOrWhenFetched(userURI, undefined, function(ok, body) {
        console.log('fetched '+ userURI );
        var w = g.statementsMatching($rdf.sym(userURI), CURR('wallet'));
        console.log(wallets);
        for (var i = 0; i < w.length; i++) {
          var wallet = w[i];
          var walletURI = wallet.object.uri;
          console.log('fetching : ' + walletURI);
          wallets.push(walletURI);

          f.nowOrWhenFetched(walletURI.split('#')[0], undefined, function(ok, body) {
            console.log('fetched : ' + walletURI);
            renderWallets();
          });
        }
      });

    }


    function renderWallets() {
      console.log('rendering wallets');
      console.log(wallets);
      for (var i = 0; i < wallets.length; i++) {
        var wallet = wallets[i];
        var type = g.any($rdf.sym(wallet), RDFS('label'));
        console.log('type for ' + wallet + ' is ' + type);
        if (type.value === 'work') {
          workURI = g.any($rdf.sym(wallet), CURR('api')).uri;
          console.log(workURI);
        }
        if (type.value === 'chores') {
          choresURI = g.any($rdf.sym(wallet), CURR('api')).uri;
          console.log(choresURI);
        }
        if (workURI && choresURI) {
          fetchStats();
        }
      }

    }

    function fetchStats() {
      var uri = workURI + 'today?source=' + encodeURIComponent(userURI);
      //var workURI = 'http://melvincarvalho.com:11088/today?source=https://melvincarvalho.com/%23me';
      console.log('fetching :' + uri);
      $.get(uri, function( work ) {
        if (work && work['https://w3id.org/cc#amount']) {
          view.widgets.summary.work = work['https://w3id.org/cc#amount'];
        }
      });

      //var choresURI = 'http://melvincarvalho.com:11089/today?source=https://melvincarvalho.com/%23me';
      uri = choresURI + 'today?source=' + encodeURIComponent(userURI);
      console.log('fetching :' + uri);
      $.get(uri, function( work ) {
        if (work && work['https://w3id.org/cc#amount']) {
          view.widgets.summary.tidy = work['https://w3id.org/cc#amount'];
        }
      });
    }

    function populateUser(userURI) {
      solid.identity.getProfile(userURI).then(function (parsedProfile) {
        console.log('getProfile result: %o', parsedProfile);
        kb = parsedProfile.parsedGraph;

        var name = kb.any($rdf.sym(userURI), FOAF('name'));
        var avatar = kb.any($rdf.sym(userURI), FOAF('depiction')) || kb.any($rdf.sym(userURI), FOAF('img'));
        console.log(name);
        console.log(avatar);
        if (name) {
          view.user.name = name.value;
        }
        if (avatar) {
          view.user.avatar = avatar.uri;
        }
        view.user.loggedIn = true;

        fetchWallets();

        $('#logout').on('click', function() {
          console.log('logging out...');
          view.user.loggedIn = false;
          view.user.avatar = "dist/img/avatar3.png";
          view.user.name = "Login";
        })

      });

    }

  });

});
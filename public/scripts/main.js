(function($, document, skrollr, angular) {
  var $window = $(window);
  var $section = $('.section');
  var $body = $('body');
  var $planContainer = $('#page-plan .plan-container');
  var _s;

  $section.css('min-height', $window.height());

  $body.imagesLoaded(function() {
    $body.removeClass('loading').addClass('loaded');
    setTimeout(function() {
      adjustWindow();
    });
  });

  function getSkrollr() {
    if (!_s) {
      _s = skrollr.init({
        forceHeight: false,
        constants: {
          winH: function() {
            return $window.height();
          }
        },
        keyframe: function(element, name, direction) {
          if ($planContainer.is(element)) {
            console.log(name);
            if (name === 'data50Top') {
              drawPlanCanvas();
            }
          }
        }
      });

      skrollr.menu.init(_s);
    }

    return _s;
  }

  function adjustWindow() {
    $section.css('min-height', $window.height());
    setTimeout(function() {
      $section.each(function() {
        var $elem = $(this);
        $elem.height($elem.height());
      });
      getSkrollr().refresh($section);
    });
    
  }

  
  var _drawn = false;
  function drawPlanCanvas() {    

    if (_drawn) {
      return;
    }

    var canvas = document.getElementById('plan-canvas');
    var ctxt = canvas.getContext('2d');

    var _startTime;
    var anilength = 3000;
    var canvYStart = 1/2;
    var dash = 10;
    var _lastP = [0, canvas.height * canvYStart];
    var _lastDrawStart = 0;

    requestAnimationFrame(doDraw);

    _drawn = true;

    function doDraw() {

      if (!_startTime) {
        _startTime = Date.now();
      }

      var elapsed = (Date.now() - _startTime);
      var y = - 50 * Math.sin((elapsed * 4 * Math.PI) / anilength) + canvas.height * canvYStart;
      var x = (canvas.width * elapsed/anilength);

      if (_lastP[0] - _lastDrawStart <= dash) {
        ctxt.moveTo(_lastP[0], _lastP[1]);
        ctxt.lineTo(x, y);
        ctxt.stroke();  
      } else if (_lastP[0] - _lastDrawStart >= 2*dash) {
        ctxt.moveTo(_lastP[0], _lastP[1]);
        ctxt.lineTo(x, y);
        ctxt.stroke();  
        _lastDrawStart = _lastP[0];
      }
      
      maybeAddPoint(Math.PI/2, 'friday');
      maybeAddPoint(3 * Math.PI/2, 'saturday');
      maybeAddPoint(5 * Math.PI/2, 'party');
      maybeAddPoint(7 * Math.PI/2, 'sunday');

      _lastP = [x, y];

      if (elapsed < anilength) {
        requestAnimationFrame(doDraw);
      } else {
        _startTime = undefined;
      }  

      function maybeAddPoint(point, day) {
        var canvPoint = (canvas.width/(4*Math.PI)) * point;
        if ((_lastP[0] < canvPoint) && (x >= canvPoint)) {
          var sinx = Math.sin(point);
          var yval = -50 * sinx + canvas.height * canvYStart;
          ctxt.beginPath();
          ctxt.arc(canvPoint, yval, 10, 0, 2*Math.PI);
          ctxt.fillStyle = '#008cba';
          ctxt.fill();

          var realX = (canvas.offsetWidth/(4*Math.PI)) * point;
          var realY = (canvas.offsetHeight/canvas.height) * yval;

          var dayEl = $('#plan-' + day);
          var dayTitle = dayEl.find('.day-title');
          var dayDesc = dayEl.find('.day-description');

          var descOffset = sinx > 0 ? 30 : 10;

          dayEl.addClass('showing');
          dayTitle.css({position: 'absolute', top: realY - dayTitle.height() - 10, left: realX - dayTitle.width()/2});
          dayDesc.css({position: 'absolute', top: realY + descOffset, left: realX - dayDesc.width()/2});
        }  
      }
    }
  }

  angular.module('stcd', ['firebase'])
    .factory('Auth', [
      '$firebaseAuth',
      function($firebaseAuth) {
        var ref = new Firebase("https://crackling-inferno-9786.firebaseio.com");
        return $firebaseAuth(ref);
      }
    ])
    .factory('RSVP', [
      '$firebase',
      function($firebase) {
        var ref = new Firebase("https://crackling-inferno-9786.firebaseio.com/");

        function emailToId(email) {
          return email.replace(/\./g, ',');
        }

        return function(email, name, attending, reserve, songs) {
          
          var userRef = ref.child('/users/' + emailToId(email));

          var sync = $firebase(userRef);
          return sync.$update({
            name: name,
            email: email,
            attending: attending,
            reserveYurt: reserve,
            songs: songs
          });
        };
      }
    ])
    .controller('StcdController', [
      '$q',
      'Auth',
      'RSVP',
      function($q, Auth, RSVP) {

        var self = this;
      
        
        this.fbAuth =  fbAuth;
        this.anonAuth = anonAuth;
        this.user = Auth.$getAuth();
        this.auth = Auth;
        this.rsvp = rsvp;

        this.attending = 'yes';
        this.reserveYurt = false;
        this.username = '';
        this.email = '';

        Auth.$onAuth(function() {
          self.user = Auth.$getAuth();  
        });

        function fbAuth() {

          var props = {scope: 'email'};

          Auth.$authWithOAuthPopup('facebook', props).catch(function(error) {
            if (error.code === 'TRANSPORT_UNAVAILABLE') {
              return Auth.$authWithOAuthRedirect('facebook', props);
            } else {
              return $q.reject(error);
            }
          }).catch(function(err) {
            console.error(err);
          });
          

        }

        function anonAuth() {
          Auth.$authAnonymously({remember: 'sessionOnly'}).catch(function(err) {
            console.error(err);
          });
        }

        function rsvp() {
          var name = self.user.facebook ? self.user.facebook.displayName : self.userName;
          var email = self.user.facebook ? self.user.facebook.email : self.email;

          var reserve = self.reserveYurt;
          var attending = self.attending === 'yes';
          var songs = self.songs;

          if (!(name && email)) {
            self.nameErr = !name;
            self.emailErr = !email;
            return;
          }

          self.rsvping = true;
          RSVP(email, name, attending, reserve, songs).then(function() {
            self.rsvping = false;
            self.rsvped = true;
          });
        }
      }
    ]);

})(jQuery, document, skrollr, angular);
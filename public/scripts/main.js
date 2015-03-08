(function($, document, skrollr, angular) {

  $(document).ready(function() {
    var $window = $(window);
    var $section = $('.section');
    var $body = $('body');
    var $preload = $('#preload');
    var $planContainer = $('#page-plan .plan-container');
    var _canvasDrawn = false;
    var _s;
    var _maxBgSize = [];
    var _canvasAnimReq;
    var _lastWindowWidth = $window.width();
    var partyTime = new Date(1468080000000);

    $.cloudinary.config({cloud_name: 'savethecharlotdate'});

    var bgImgs = [
      'photo3_jdllrl',
      'IMG_1467_n6sxjg',
      'IMG_1448_ppvdih',
      'IMG_1502_azsfky',
      'IMG_0249_p6cztd'
    ];

    $section.css('min-height', $window.height());

    $body.addClass(isMobile() ? 'mobile': 'desktop');

    init();

    $window.on('resize', function() {
      // Redo the canvas if the width of the window has changed
      var newWidth = $window.width();
      console.log(newWidth, _lastWindowWidth);
      var clearCanvas = (newWidth !== _lastWindowWidth);
      _lastWindowWidth = newWidth;
      init(clearCanvas);
    });

    function init(clearCanvas) {
      if (clearCanvas) {
        clearPlanCanvas();
      }

      adjustWindow(function() {

        maybeDrawPlan();

        var bgImg = bgImage(0);
        $preload.append(bgImg);
        $preload.imagesLoaded(function() {
          var imgSrc = bgImg.get(0).src;
          bgLoaded(0, imgSrc);

          var imgs = [imgSrc];
          bgImgs.slice(1).forEach(function(imgName, index) {
            var bgImg = bgImage(index + 1);
            $preload.append(bgImg);
            imgs.push(bgImg.get(0).src);
          });

          $preload.imagesLoaded().progress(function(instance, image) {
            if (image.isLoaded) {
              var src = image.img.src;
              var index = imgs.indexOf(src);
              bgLoaded(index, src);
            }
          });
        });
      });
    }

    // $preload.imagesLoaded(function() {
    //   bgLoaded(0);

    //   bgImgs.slice(1).forEach(function(imgUrl) {
    //     var img = $('<img>');
    //     img.attr('src', imgUrl);
    //     $preload.append(img);
    //   });

    //   $preload.imagesLoaded().progress(function(instance, image) {
    //     if (image.isLoaded) {
    //       bgLoaded(image.img.src);
    //     }
    //   });
    // });

    if (isMobile()) {
      watchForPlanInView();
    }

    function getBgDiv(index) {
      return $($section.get(index)).find('.background');
    }

    function bgImage(index) {
      var imgName = bgImgs[index] + '.jpg';
      $bg = getBgDiv(index);
      var minHeight = $bg.height();
      var minWidth = $bg.width();

      if (_maxBgSize[index]) {
        var prevSize = _maxBgSize[index];
        minHeight = Math.max(minHeight, prevSize[1]);
        minWidth = Math.max(minWidth, prevSize[0]);
      }

      _maxBgSize[index] = [minWidth, minHeight];

      return $.cloudinary.image(imgName, {
        crop: 'fill',
        width: minWidth,
        height: minHeight
      });
    }

    function bgLoaded(index, imgsrc) {

      var $bg = getBgDiv(index);
      $bg.css('background-image', 'url(' + imgsrc + ')');
      $bg.addClass('loaded');
    }

    function isMobile() {
      return (/Android|iPhone|iPad|iPod|BlackBerry/i).test(navigator.userAgent || navigator.vendor || window.opera);
    }

    function maybeDrawPlan() {
      var val = $planContainer.offset().top +
                $planContainer.height() -
                $window.scrollTop() -
                $window.height();

      // Will be < 0 if the bottom of the plan container is in view
      if (val < 0) {
        drawPlanCanvas();
      }
    }

    function watchForPlanInView() {
      $window.on('scroll', maybeDrawPlan);
    }

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

    function adjustWindow(callback) {
      if(isMobile()) {
        if (callback) {
          callback();
        }

        return;
      }

      $section.css('min-height', $window.height());
      setTimeout(function() {
        $section.each(function() {
          var $elem = $(this);
          $elem.height($elem.height());
        });

        getSkrollr().refresh($section);

        if (callback) {
          callback();
        }
      });

    }

    function clearPlanCanvas() {

      if (_canvasAnimReq) {
        cancelAnimationFrame(_canvasAnimReq);
      }

      $('.day').removeClass('showing');
      $('.day-title').css('position', '');
      $('.day-description').css('position', '');
      var canvas = document.getElementById('plan-canvas');
      var context = canvas.getContext('2d');
      context.clearRect(0 , 0, canvas.width, canvas.height);
      canvas.width = canvas.width;
      _canvasDrawn = false;
    }

    function drawPlanCanvas() {
      if (_canvasDrawn) {
        return;
      }

      var canvas = document.getElementById('plan-canvas');
      var $canvas = $(canvas);

      if (!$canvas.is(':visible')) {
        return;
      }


      var ctxt = canvas.getContext('2d');

      var _startTime;
      var _lastTick;
      var elapsed = 0;
      var minanilength = 3000;
      var canvYStart = 1/2;
      var dash = 10;
      var _lastP = [0, canvas.height * canvYStart];
      var _lastDrawStart = 0;
      var maxGap = minanilength * dash/canvas.width;
      var timeToGoEl = $('#time-to-go');

      _canvasAnimReq = requestAnimationFrame(doDraw);

      _canvasDrawn = true;

      function doDraw() {

        if (_lastTick) {
          elapsed = elapsed + Math.min(Date.now() - _lastTick, maxGap);
        }

        _lastTick = Date.now();

        var y = - 50 * Math.sin((elapsed * 4 * Math.PI) / minanilength) + canvas.height * canvYStart;
        var x = (canvas.width * elapsed/minanilength);

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
        maybeAddTimeToGo(4 * Math.PI);

        _lastP = [x, y];

        if (elapsed < minanilength) {
          _canvasAnimReq = requestAnimationFrame(doDraw);
        } else {
          _lastTick = undefined;
        }

        function maybeAddTimeToGo(point) {
          var canvPoint = (canvas.width/(4*Math.PI)) * point;
          if ((_lastP[0] < canvPoint) && (x >= canvPoint)) {
            timeToGoEl.addClass('showing');
          }
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

            dayEl.addClass('showing');

            var dayTitle = dayEl.find('.day-title');
            var dayDesc = dayEl.find('.day-description');

            // var descOffset = sinx > 0 ? 30 : 10;
            var titleAbove = sinx > 0;

            dayTitle.each(function() {
              var $this = $(this);
              var top;
              if (titleAbove) {
                top = realY - $this.height() - 10;
              } else {
                top = realY + 30;
              }

              $this.css({position: 'absolute', top: top, left: realX - $this.width()/2});
            });
            dayDesc.each(function() {
              var $this = $(this);
              var top;
              if (titleAbove) {
                top = realY;
              } else {
                top = realY - $this.outerHeight();
              }
              $this.css({position: 'absolute', top: top, left: realX - $this.width()/2});
            });
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

            var data = {
              name: name,
              email: email,
              attending: attending,
              reserveYurt: reserve
            };

            if (songs) {
              data.songs = songs;
            }

            return sync.$update(data);
          };
        }
      ])
      .controller('PartyController', [
        '$timeout',
        function($timeout) {
          var self = this;
          timeUntilParty();

          function timeUntilParty() {
            var ms = partyTime - Date.now();
            var seconds = Math.floor(ms/1000) % 60;
            var minutes = Math.floor(ms/(60 * 1000)) % 60;
            var hours = Math.floor(ms/(60 * 60 * 1000)) % 24;
            var days = Math.floor(ms/(24 * 60 * 60 * 1000));

            self.timeUntilParty = {
              days: days,
              hours: hours,
              minutes: minutes,
              seconds: seconds
            };
            $timeout(timeUntilParty, 1000);
          }
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

            self.authorizing = true;
            Auth.$authAnonymously({remember: 'sessionOnly'}).then(function() {
              self.authorizing = false;
            }).catch(function(err) {
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

      angular.bootstrap(document, ['stcd']);
  });

})(jQuery, document, skrollr, angular);

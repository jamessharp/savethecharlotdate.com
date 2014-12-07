(function($, document, skrollr) {
  var $window = $(window);
  var $section = $('.section');
  var $body = $('body');
  var $planContainer = $('#page-plan .plan-container');
  var _s;

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

})(jQuery, document, skrollr);
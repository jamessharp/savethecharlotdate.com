(function($, skrollr) {
  var $window = $(window);
  var $section = $('.section');
  var $body = $('body');

  $body.imagesLoaded(function() {
    setTimeout(function() {
      adjustWindow();
      $body.removeClass('loading').addClass('loaded');
    });
  });

  function adjustWindow() {

    var winH = $window.height();
    if (winH < 550) {
      winH = 550;
    }

    var s = skrollr.init({
      forceHeight: false,
      constants: {
        winH: winH
      }
    });

    $section.css('min-height', winH);

    s.refresh($section);
  }
})(jQuery, skrollr);
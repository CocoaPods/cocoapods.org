/*
*= require jquery-2.0.3.min
*= require modernizr.min
*= require bootstrap.min

*= require history.min.js
*= require history.adapter.jquery.min.js
*= require picky.min.js
*= require search.config.js
*= require cocoapush.js
*= require zero-clipboard.min.js
*= require has_flash.js
*= require ICanHaz.js
*/

// Remove keyboard on scroll
//
$(document).bind("touchmove", function(e){
  document.activeElement.blur();
  $("input").blur();
});

$( document ).ready( function(){
  $('.underscore a[data-toggle="tab"]').on('show.bs.tab', function (e) {

    var index = $(e.target.parentElement).index()
    var width = $(window).width();
    var constant = (width < 768) ? 33: 40;
    var percent = (index * constant).toString()
    $("#homepage-tab-indicator").css("margin-left", percent + "%");
  })

  if( hasFlash() ) {
    $("html").addClass("flash")
  }
});

/*
*= require jquery.min
*= require modernizr.min
*= require bootstrap.min

*= require history.min.js
*= require history.adapter.jquery.min.js
*= require picky.min.js
*= require search.config.js
*/

// Remove keyboard on scroll
$(document).bind("touchmove", function(e){
  
  document.activeElement.blur();
	$("input").blur();
});


$( document ).ready( function(){
  $('.underscore a[data-toggle="tab"]').on('show.bs.tab', function (e) {
    
    var index = $(e.target.parentElement).index()
    console.log("index = " + index)
    var percent = (index * 40).toString()
    $("#homepage-tab-indicator").css("margin-left", percent + "%");
  })  
  
})

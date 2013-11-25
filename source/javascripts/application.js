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

/*
*= require jquery-2.0.3.min
*= require modernizr.min
*= require bootstrap.min

*= require history.min.js
*= require history.adapter.jquery.min.js
*= require picky.min.js
*= require search.config.js
*= require zero-clipboard.min.js
*= require has_flash.js
*= require ICanHaz.js
*= require jquery.cookie.js
*/

// Sets up tabs for README/CHANGELOGs
// Placed here so it can be accessed
// by search results, and pod pages.
//
var post_expansion_setup = function(){
  $("#asset_switcher").tab();
  $('[data-toggle="tabajax"]').click(function(e) {
    var $this = $(this)
    var loadurl = $this.attr('href')
    var target = $this.attr('data-target')
    if ($(target).children().length == 0) {
      $.get(loadurl, function(data) {
        $(target).html(data);
      });
    }
    
    $this.tab('show');
    return false;
  });
}

// Remove keyboard on scroll
//
$(document).bind("touchmove", function(e){
  document.activeElement.blur();
  $("input").blur();
});

$( document ).ready( function(){

  // Add support for animating the marker on the homepages
  //
  $('.underscore a[data-toggle="tab"]').on('show.bs.tab', function (e) {
    var index = $(e.target.parentElement).index()
    var width = $(window).width();
    var constant = (width < 768) ? 33: 40;
    var percent = (index * constant).toString()
    $("#homepage-tab-indicator").css("margin-left", percent + "%");
  })

  // Support non-flash clipboard stuff
  //
  if( hasFlash() ) {
    $("html").addClass("flash")
  }

  post_expansion_setup();
});

var rootSelector = ".space_for_appsight"

var showAppSight = function(name) {
  $(rootSelector).empty()
  
  $.getJSON("https://www.appsight.io/api/1.0/sdks/find?filter=top-apps-using&cocoapod=" + name + "&callback=?", function( data ) {
    if (data.status && data.status.is_successful) {
      if (data.result) {
        $('<p>Apps using <a href="' + data.result.href + '">' + name + '</a></p>').appendTo(rootSelector)

        $.each(data.result.apps_using, function(i, app){
          var a = $('<a href=' + app.href + ' targer="_blank"/>')
          $('<img/>', {
            src: app.icons[0].url,
            title: app.name,
            style: 'margin: 2px;',
            "data-toggle": 'tooltip',
            "data-placement": 'top'
          }).appendTo(a)
          $(a).appendTo(rootSelector)
        })

        $(rootSelector + ' [data-toggle="tooltip"]').tooltip()
        var settings = '<sub><a data-toggle="modal" data-target="#app_sight_info" href="#">Settings</a></sub>'
        var poweredBy = '<sub>powered by <a href="http://appsight.io">AppSight.io</a></sub>'
        $('<div style="display: flex; flex-direction: row; justify-content: space-between;">' + settings + poweredBy + '</div>').appendTo(rootSelector)
        $('<hr/>').appendTo(rootSelector)
      }
    }
  });
}

var disableAppSight = function(name) {
  $.cookie('appsight', "false")
  $("#app_sight_info").modal('hide')
  $(rootSelector).empty()  
  checkForAppSight(name)
}

var checkForAppSight = function(name) {
  if($.cookie('appsight') !== "enabled") {
    $(rootSelector).append("<button class='btn' type='button'>Show Apps using " + name + "</button><hr/>")
    $(rootSelector + " .btn").on('click', function (e) {  
      $.cookie('appsight', "enabled")
      showAppSight(name)
    })
  } else {
    showAppSight(name)
  }
}

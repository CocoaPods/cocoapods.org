$(window).ready(function() {
  // The search uses the convenience API on search.cocoapods.org.
  //
  var domain = 'https://search.cocoapods.org';
  // var domain = 'http://localhost:8080';

  var searchURL = domain + '/api/v1/pods.picky.hash.json';
  var noResultsURL = domain + '/no_results.json';

  var onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  var searchInput = $('#search input[type="search"]');
  var helpText = $('#search fieldset p');

  var platformRemoverRegexp = /\b(platform|on\:\w+\s?)+/;
  var platformSelect = $("#search_results div.platform");
  var sortingSelect =  $("#search_results div.sorting");
  var languageRemoverRegexp = /\b(lang\:\w+\s?)+/;
  var languageSelect = $("#search_results div.language");


  var allocationSelect = $('#search_results div.allocations');
  var resultsContainer = $('#results_container');

  // Tracking the search results.
  //
  var trackAnalytics = function(data, query) {
    var total = data.total;
    if (total > 0) {
      _gaq.push(['_trackEvent', 'search', 'with results', query, total]);
    } else {
      _gaq.push(['_trackEvent', 'search', 'not found', query, 0]);
    }
  }

  // Tracking platform selection.
  //
  var trackPlatformSelection = function() {
    _gaq.push(['_trackEvent', 'platform', 'switch platform', platformSelect.find('input:checked').val(), 1]);
  }

  // Tracking language
  var trackLanguageSelection = function() {
    _gaq.push(['_trackEvent', 'language', 'switch language', languageSelect.find('input:checked').val(), 1]);
  }

  // Tracking category/categories selection.
  //
  var trackAllocationSelection = function(category, count) {
    _gaq.push(['_trackEvent', 'allocation', 'filter categories', category, count]);
  }

  // Tracking category/categories selection.
  //
  var trackResultLinkSelection = function(href) {
    _gaq.push(['_trackEvent', 'resultlink', 'click outbound link', href, 1]);
  }

  // Sets the checkbox labels correctly.
  //
  var selectCheckedPlatform = function() {
    platformSelect.find('label').removeClass('selected');
    platformSelect.find('input:checked + label').addClass('selected');
  };

  var selectCheckedLanguage = function() {
    languageSelect.find('label').removeClass('selected');
    languageSelect.find('input:checked + label').addClass('selected');
  };

  var currentPlatform = function() {
    return platformSelect.find("input:checked");
  };
  var defaultPlatform = function() {
    return platformSelect.find("input:first")
  };
  var selectDefaultPlatform = function() {
    defaultPlatform().prop('checked', true);
  };

  var currentLanguage = function() {
    return languageSelect.find("input:checked");
  };
  var defaultLanguage = function() {
    return languageSelect.find("input:first")
  };
  var selectDefaultLanguage = function() {
    defaultLanguage().prop('checked', true);
  };


  // Hide the header.
  //
  var headerHidden = false;
  var hideHeader = function() {
    if (!headerHidden) {
      $('html, body').animate({ scrollTop: searchInput.offset().top }, 300);
      resultsContainer.addClass("active");
      helpText.hide();
      headerHidden = true;
    }
  };

  // Show the header.
  //
  var showHeader = function() {
    if (headerHidden) {
      $('html, body').animate({ scrollTop: 0 }, 300);
      resultsContainer.removeClass("active");
      helpText.show();
      headerHidden = false;
    }
  };

  // Reset the search interface to its initial configuration.
  //
  var resetSearchInterface = function() {
    showHeader();
    $('#search span.amount').hide();
    $('#search span#search_loupe').show();
    platformSelect.hide();
    languageSelect.hide();
    sortingSelect.hide();
    allocationSelect.hide();
    $('#search_results div.results').hide();
  };

  //
  //
  var prepareSearchInterfaceForResults = function() {
    hideHeader();
    $('#search span.amount').show();
    $('#search span#search_loupe').hide();
  };

  var resultsSearchInterface = function() {
    platformSelect.show();
    languageSelect.show();
    sortingSelect.show();
    allocationSelect.show();
  };

  var removePlatform = function(query) {
    return query.replace(platformRemoverRegexp, '');
  };

  var removeLanguage = function(query) {
    return query.replace(languageRemoverRegexp, '');
  };

  //
  //
  var noResultsSearchInterface = function(query) {
    platformSelect.show();
    languageSelect.show();
    sortingSelect.show();
    allocationSelect.hide();

    // Get special no_results hash from the search API:
    //  * autosplit query
    //  * tags
    //
    // TODO There's the problem that we query without platform,
    //      but then the result might be wrong.
    //
    $.getJSON(noResultsURL, 'query=' + removeLanguage(removePlatform(query)), function(data, textStatus, jqXHR) {
      var suggested_query = data.split[0].join(' ');
      var total = data.split[1];

      var splitsContainer = $('#results_container .no_results .splits');
      if (suggested_query && total > 0) {
        splitsContainer.html("<p>We found " + total + " results searching for just <a href='javascript:pickyClient.resetFiltersAndInsert(\"" + suggested_query + "\");'>'" + suggested_query + "' without filters</a>.</p>")
      } else {
        splitsContainer.html('');
      }

      var tagsContainer = $('#results_container .no_results .tags');
      var tags = [];
      $.each(data.tag, function(name, amount) {
        tags.push("<a href='javascript:pickyClient.insert(\"tag:" + name + "\");'>" + name + "</a>");
      });
      tagsContainer.html("<p>Maybe it helps exploring via one of our keywords? </p>")
      tagsContainer.find('p').append(tags.sort().join(', ')).append('.');
    });
  };

  // Tracking category/categories selection.
  //
  var expandSearchResult = function(result) {
    result = $(result)
    result.addClass("loading")
    result.removeClass("expandable")

    var url = "/pods/" + result.data("pod-name") + "/inline";

    // Hosted by Middleman?
    if (document.location.host == "localhost:4567") {
      url = "http://localhost:3000/" + url
    }

    $.ajax({
      url: url,
      dataType: "html"
    }).done(function(html) {
      result.data("span", "2")
      result.addClass("is-expanded")
      result.removeClass("loading")
      $(result, ".expanded .content")[0].innerHTML = html

      /// This can be found in application.js
      post_expansion_setup()
    }).fail(function() {
      result.removeClass("loading")
    });
  }

  // Renders an entry, then returns the rendered HTML.
  //
  // TODO Improve. This is just a quick prototype.
  //
  var platformMapping = {
    ios: 'iOS',
    osx: 'OS X'
  };
  var goodSource = /^http/;

  var extractRepoFromSource = function(entry) {
    var link, value;
    var source = entry.source;
    for (var key in source) {
      if (key == 'http') { return ''; }

      value = source[key];
      if (!value) {
        console.log('The following entry did not contain a source: ' + entry.id);
      }
      if (value && value.toString().match(goodSource)) { link = value; break; }
    }
    return link;
  };

  var render = function(entry) {
    entry.platform = platformMapping[entry.platforms];
    // Not used currently. This needs a fix.
    // entry.authors  = $.map(entry.authors, function(email, name) {
    //   return '<a href="javascript:pickyClient.insert(\'' + name.replace(/[']/, "\\\\\'") + '\')">' + name + '</a>';
    // });

    entry.docs_link = entry.documentation_url || 'http://cocoadocs.org/docsets/' + entry.id + '/' + entry.version;
    entry.site_link = entry.link || extractRepoFromSource(entry)
    entry.spec_link = 'https://github.com/CocoaPods/Specs/tree/master/Specs/' + entry.id + '/' + entry.version + '/' + entry.id + '.podspec.json'

    // If the version string has any non-numeric characters (pre-release or build metadata flags),
    // the clipboard copy prompt should use the raw version number.
    // (https://github.com/CocoaPods/cocoapods.org/issues/79)
    if (entry.version.match(/[^.0-9]/)) {
      entry.clipboard_version = entry.version;
    } else {
      var minor_version = entry.version.split('.').slice(0, 2).join(".")
      entry.clipboard_version = "~> " + minor_version;
    }

    if (entry.deprecated_in_favor_of) {
      entry.deprecated_in_favor_of_link = "https://cocoapods.org?q=" + entry.deprecated_in_favor_of;
    } else {
      entry.deprecated_in_favor_of_link = ""
    }

    // render with ICanHaz, see _search-templates
    if (entry.cocoadocs) {
      entry.site_link = "/pods/" + entry.id
      return ich.expandable_search_result(entry, true)
    } else {
      return ich.search_result(entry, true)
    }

  };

  // We remember the most recent queries.
  // If they return in order, we show them.
  //
  var mostRecentQueries = [];
  var addMostRecentQuery = function(query) {
    if (mostRecentQueries[mostRecentQueries.length-1] != query) {
      mostRecentQueries.push(query);
      return true;
    }
    return false;
  }
  var tooLateResponse = function(successfulQuery) {
    if (mostRecentQueries.indexOf(successfulQuery) >= 0) {
      while (successfulQuery.length > 0) {
        query = mostRecentQueries.shift();
        if (query == successfulQuery) {
          return false;
        }
      }
      return true;
    }
    // It's not in the queries anymore – too old.
    return true;
  };

  pickyClient = new PickyClient({
    full: searchURL,
    fullResults: 20,

    // The live query does a full query.
    //
    live: searchURL,
    liveResults: 20,
    liveRendered: true, // Experimental: Render live results as if they were full ones.
    liveSearchInterval: 166, // Time between keystrokes before it sends the query.
    maxSuggestions: 5, // Bootstrap currently hides .hidden class using !important, which blocks Picky's behaviour :( (we now use .onrequest)
    alwaysShowResults: true, // Always show results, even when Picky does not know what categories the user wants.
    alwaysShowSelection: true, // Always show the selection of what your search means, even when Picky would not show it normally.
    wrapResults: '<ol class="results"></ol>', // Always wrap the results in an ol.results.

    // Instead of enclosing the search in #picky,
    // in the CocoaPods search we use #search.
    //
    enclosingSelector: '#search',
    resultsSelector: '#search_results div.results',
    noResultsSelector: '#results_container .no_results',
    allocationsSelector: '#search_results div.allocations',
    hiddenAllocations: '#search_results div.allocations .onrequest',
    counterSelector: '#search_results span.amount',
    moreSelector: '#search_results .allocations .more',

    // Before a query is inserted into the search field
    // we clean it of any platform terms.
    //
    // And if there are any platform /language terms, we select
    // the right platform selector.
    //
    beforeInsert: function(query) {
      if ('' != query) {
        prepareSearchInterfaceForResults();

        var platforms = query.match(platformRemoverRegexp);
        if (platforms) {
          var chosenPlatform = platformSelect.find('input[value="' + platforms[0].replace(/\s+$/g, '') + '"]');
          chosenPlatform.attr('checked', 'checked');
          platformSelect.find('label').removeClass('selected');
          platformSelect.find('input:checked + label').addClass('selected');
        }
        query = removePlatform(query);

        var language = query.match(languageRemoverRegexp)
        if (language) {
          var chosenLanguage = languageSelect.find('input[value="' + language[0].replace(/\s+$/g, '') + '"]');
          chosenLanguage.attr('checked', 'checked');
          languageSelect.find('label').removeClass('selected');
          languageSelect.find('input:checked + label').addClass('selected');
        }
        return removeLanguage(query);
      }

    },
    // Before a query is run, we add a few params.
    //
    beforeParams: function(params) {
      params['sort'] = sortingSelect.find('> a').attr("data-sorting");
      return params;
    },
    // Before Picky sends any data to the server.
    //
    // Adds the platform modifier to it if it isn't there already.
    // Removes it if it is.
    //
    // Before Picky sends any data to the server.
    //
    // Adds the platform modifier to it if it isn't there already.
    // Removes it if it is.
    //
    before: function(query, params) {
      // We don't add the platform if it is empty (still saved in history as empty, though).
      //
      if (query == '') { return ''; }

      // Otherwise we add in the platform.
      //
      query = query.replace(platformRemoverRegexp, '');
      var platformModifier = platformSelect.find("input:checked").val();
      if (platformModifier !== undefined && platformModifier != '') {
        query = platformModifier + ' ' + query;
      }

      query = query.replace(languageRemoverRegexp, '');
      var languageModifier = languageSelect.find("input:checked").val();
      if (languageModifier !== undefined && languageModifier != '') {
        query = languageModifier + ' ' + query;
      }

      // We remember the query if it hasn't just run.
      //
      if (!addMostRecentQuery(query)) {
        // It wasn't added (we just sent it off), so stop the query.
        return;
      }

      return query;
    },
    success: function(data, query) {
      // Track query for analytics.
      //
      trackAnalytics(data, query);

      // If somebody cleared the search input, do not show any results
      // arriving "late" (well, slower than the person can press backspace).
      //
      if ('' == searchInput.val()) {
        resetSearchInterface();
        return false;
      }

      // If a newer query has already been
      // shown, then do not show this query.
      //
      if (tooLateResponse(query)) {
        return false;
      }

      // If no results are found.
      //
      if (0 == data.total) {
        noResultsSearchInterface(query);
      } else {
        resultsSearchInterface();
      }

      // Render the JSON into HTML.
      //
      var allocations = data.allocations;
      allocations.each(function(i, allocation) {
        allocation.entries = allocation.entries.map(function(i, entry) {
          return render(entry);
        });
      });

      return data;
    },
    // After Picky has handled the data and updated the view.
    //
    after: function(data) {

      // Install Popovers for the copy to clipboard
      // depending on whether ZeroClipboard succeeds
      $copy_to_clipboard = $('ol.results img.copy')

      var clip = new ZeroClipboard(
        $copy_to_clipboard, {
          moviePath: "./flashes/ZeroClipboard.swf",
          forceHandCursor: true
        }
      );

      clip.on( 'noflash', function ( client, args ) {

        // provide a recursive wait method
        // that checks for the hover on the popover/clipboard
        // before hiding so you can select text

        function closePopoverForNode(node){
          setTimeout(function() {
            if (!$(node).is(':hover') && !$(".popover:hover").length) {
              $(node).popover("hide")
            } else {
              closePopoverForNode(node)
            }
          }, 500);
        }

        // With no flash you should be able to select the text
        // in the popover

        $copy_to_clipboard.popover({
          trigger: "manual",
          container: "body"

        }).on("click", function(e) {
          e.preventDefault();

        }).on("mouseenter", function() {
          $(this).popover("show");
          $(".popover input").select()

        }).on("mouseleave", function() {
          closePopoverForNode(this)
        });
      });

      // When Flash works, just do a normal popover
      clip.on("load", function(client) {

        client.on( "complete", function(client, args) {
          $("h4.has-flash").text("Saved to clipboard");
          $(".popover").addClass("saved")
        });

        clip.on( 'mouseover', function ( client, args ) {
          $(this).popover('show')
        });

        clip.on( 'mouseout', function ( client, args ) {
          $(this).popover('hide')
        });
      });

      // Install tracking on the allocation selection.
      //
      allocationSelect.find('li').on('click', function(event) {
        var li = $(event.currentTarget);
        trackAllocationSelection(li.find('.text').text(), li.find('.count').text());
        // Rest is handled in Picky JS.
      });

      // Install tracking on each result link.
      //
      $('ol.results').find('a').on('click', function(event) {
        trackResultLinkSelection(event.currentTarget.href);
      });

      $('ol.results li').on('click', function(event) {
        var target = $(event.target)
        if (target.is("li.result") == false) {
          target = $(event.target).parents("li.result")
        }

        // Allow new tabs
        if (event.metaKey == true) { return true }
        // Support middle clicking
        if (event.which == 2) { return true }
        if (target.hasClass("is-expanded")) { return true }
        if (target.data("pod-name") == undefined) { return true }

        expandSearchResult(target)
        event.stopPropagation()
        return false
      });
    },

    // This is used to generate the correct query strings, localized. E.g. "subject:war".
    // Note: If you don't give these, the field identifier given in the Picky server is used.
    //
    qualifiers: {
      en:{
        dependencies: 'uses',
        platform: 'on',
        language: 'lang'
      }
    },

    // Use this to group the choices (those are used when Picky needs more feedback).
    // If a category is missing, it is appended in a virtual group at the end.
    // Optional. Default is [].
    //
    // We group platform explicitly, so it is always positioned at
    // the start of the explanation of the choices (also, we can
    // simply not show it).
    //
    groups: [
      ['platform'],
      ['language']
    ],

    // This is used for formatting inside the choice groups.
    //
    // Use %n$s, where n is the position of the category in the key.
    // Optional. Default is {}.
    //
    choices: {
      en: {
        'platform': '', // platform is simply not shown.
        'language': '', // language is simply not shown.

        'name': 'name',
        'author': 'author',
        'summary': 'summary',
        'dependencies': 'dependency',
        'tags': 'tag',
        'version': 'version',
        'subspecs': 'subspec',
        'author,name': 'author+name',
        'name,author': 'name+author',
        'tags,name': 'tag+name',
        'name,tags': 'name+tag',
        'version,name': 'version+name',
        'name,version': 'name+version',
        'name,dependencies': 'name+dependency',
        'dependencies,name': 'dependency+name',
        'author,dependencies': 'author+dependency',
        'dependencies,author': 'dependency+author',
        'dependencies,version': 'dependency+version',
        'version,dependencies': 'version+dependency',
        'author,version': 'author+version',
        'version,author': 'version+author',
        'summary,version': 'summary+version',
        'version,summary': 'version+summary',
        'tags,summary': 'summary+name',
        'summary,tags': 'name+summary',
        'summary,name': 'summary+name',
        'name,summary': 'name+summary',
        'summary,author': 'summary+author',
        'author,summary': 'author+summary',
        'summary,dependencies': 'summary+dependency',
        'dependencies,summary': 'dependency+summary',
        'name,subspecs': 'name+subspec',
        'subspecs,name': 'subspec+name',
        'dependencies,subspecs': 'dependency+subspec',
        'subspecs,dependencies': 'subspec+dependency'
      }
    },

    // This is used to explain the preceding word in the suggestion text (if it
    // has not yet been defined by the choices above), localized. E.g. "Peter (author)".
    // Optional. Default are the field identifiers from the Picky server.
    //
    explanations: {
      en: {
        author: 'written by',
        versions: 'on version',
        dependencies: 'using',
        name: 'named',
        // platform: 'on', See below.
        // language: 'in', See below.
        summary: 'with summary',
        tags: 'tagged as',
        subspecs: 'with subspec'
      }
    },
    explanationDelimiter: {
      en: 'and'
    },
    explanationTokenCallback: function(category, tokens) {
      var length = tokens.length;

      // Special case to clarify when both platforms are AND-ed.
      //
      if (category == 'platform') {
        if (length == 2) {
          return '<strong>on</strong> both ' + tokens.join(' & ');
        } else {
          return 'only <strong>on</strong> ' + tokens[0];
        }
      } else if (category == 'language') {
        if (length == 2) {
          // This case yields no results, and only occurs if a user
          // enters text explicitly.
          return '(both ' + tokens.join(' & ') + ')';
        } else {
          return '– ' + tokens[0] + ' only,';
        }
      }
    }
    // explanationTokenDelimiter: {
    //   en: {
    //     platform: ' & '
    //   }
    // }
  });
  pickyClient.resetFiltersAndInsert = function(query) {
    selectDefaultPlatform();
    selectDefaultLanguage();
    this.insert(query);
  };

  // Reset the search if it has been cleared and track when it has.
  //
  searchInput.on('input', function(e) {
    if ('' == this.value) {
      _gaq.push(['_trackEvent', 'clear']);
      resetSearchInterface();
    } else {
      prepareSearchInterfaceForResults();
    }
  });

  // Resend query on platform selection.
  //
  // Note: Also updates the label & tracks.
  //
  platformSelect.find('input').bind('change', function(event) {
    trackPlatformSelection();
    pickyClient.resend();
    selectCheckedPlatform();
  });

  languageSelect.find('input').bind('change', function(event) {
    trackLanguageSelection();
    pickyClient.resend();
    selectCheckedLanguage();
  });

  // Resend query on sorting selection.
  //
  // Note: Also updates the label & tracks.
  //
  sortingSelect.find("ul li a").click(function(){
    var anchor = sortingSelect.find('> a')
    anchor.html( $(this).text() + ' <span class="caret">' );
    anchor.attr("data-sorting", $(this).data("sorting") );

    sortingSelect.find("ul li a.selected").removeClass("selected");
    $(this).addClass("selected");

    pickyClient.resend();
  });

  // Make all clicks in the search container set focus.
  //
  $('#search_container').on('click', function (e) {
    searchInput.focus();
  });

  // Keyboard handling.
  //
  // Currently, we only handle keyboard selecting the first result category set.
  // Use a smarter selector than next and prev for hopping into the next/previous category set
  // (so make nextResult and previousResult smarter).
  //
  // Also, we do not handle the case where the selection goes out of view.
  //
  var nextResult = function(selected){
    return selected.next();
  }
  var previousResult = function(selected){
    return selected.prev();
  }
  var selectResult = function(provideNext) {
    var results = $('ol.results li.result');
    var selected = results.closest('.selected').first();
    if (selected.length > 0) {
      selected.removeClass('selected');
      selected = provideNext(selected);
    } else {
      selected = results.first();
    }
    selected.addClass('selected');
  }
  var openSelection = function(){
    var selected = $('ol.results li.result.selected').first();
    if (selected.length > 0) {
      expandSearchResult(selected)
    }
  }

  // Install keyboard handling.
  //
  $('body').keydown(function(event) {
      switch (event.keyCode) {
      // Down
      //
      case 40:
        selectResult(nextResult)
        break;

      // Up
      //
      case 38:
        selectResult(previousResult);
        break;

      // Enter
      //
      case 13:
        if (onMobile) { searchInput.blur(); }
        openSelection();
        break;
    }
  });

  // Initially select the right platform.
  //
  if (window.initial_query != "") {
    pickyClient.insertFromURL(window.initial_query);
  }
});

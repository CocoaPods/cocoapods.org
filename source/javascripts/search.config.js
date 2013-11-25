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

$(window).ready(function() {
  var searchInput = $('#search input[type="search"]');
  
  var platformRemoverRegexp = /\b(platform|on\:\w+\s?)+/;
  var platformSelect = $("#results_container div.platform");
  
  // Sets the checkbox labels correctly.
  //
  var selectCheckedPlatform = function() {
    platformSelect.find('label').removeClass('selected');
    platformSelect.find('input:checked + label').addClass('selected');
  };
  
  //
  //
  var resetSearchInterface = function() {
    $('nav.navbar').css("opacity", "1")
    $('#search').removeClass("active");
    $('#results_container').removeClass("active")
    $('#search span.amount').hide();
    $('#search_results div.platform').hide();
    $('#search_results div.allocations').hide();
    $('#search_results div.results').hide();
  };
  
  //
  //
  var prepareSearchInterfaceForResults = function() {
    $('nav.navbar').css("opacity", "0")
    $('#search').addClass("active")
    $('#results_container').addClass("active")
    $('#search span.amount').show();
  };
  
  var resultsSearchInterface = function() {
    $('#search_results div.platform').show();
    $('#search_results div.allocations').show();
    // $('#search div.results').show(); // Picky does this already.
  };
  
  //
  //
  var noResultsSearchInterface = function() {
    // $('#search_results .no_results').show(); // Picky does this already.
    $('#search_results div.allocations').hide();
    $('#search_results div.platform').hide();
    
    $.getJSON('http://cocoapods.org/no_results.json', '', function(data, textStatus, jqXHR) {
      var tagsContainer = $('#results_container .no_results .tags');
      var tags = [];
      $.each(data.tag, function(name, amount) {
        tags.push("<a href='javascript:pickyClient.insert(\"tag:" + name + "\");'>" + name + "</a>");
      });
      tagsContainer.html("<p>Maybe it helps exploring via one of our keywords? </p>")
      tagsContainer.find('p').append(tags.sort().join(', ')).append('.');
    });
  };
  
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
      if (value.toString().match(goodSource)) { link = value; break; }
    }
    return link ? '<a href="' + link + '">Repo</a>' : '';
  };
  var render = function(entry) {
    var platform = platformMapping[entry.platforms];
    var authors  = $.map(entry.authors, function(email, name) {
      return '<a href="javascript:pickyClient.insert(\'' + name.replace(/[']/, "\\\\\'") + '\')">' + name + '</a>';
    });
    
    var info_classes = "infos col-lg-8 col-sm-7 col-xs-12"
    var action_classes = "actions col-lg-4 col-sm-5 col-xs-12"
    return '<li class="result">' +
    '  <div class="' + info_classes + '">' +
    '    <h3>' +
    '      <a href="' + entry.link + '">' + entry.id + '</a>' +
    (platform ? '<span class="os">' + platform + '</span>' : '') +
    '      <span class="version">' +
             entry.version +
    '        <span class="clippy">' + entry.podspec + '</span>' +
    '      </span>' +
    '    </h3>' +
    '    <p class="subspecs">' + entry.subspecs.join(', ') + '</p>' +
    '    <p>' + entry.summary + '</p>' +
    '    <p class="author">' + authors.join(', ') + '</p>' +
    '  </div>' +
    '  <div class="' + action_classes +'">' +
    extractRepoFromSource(entry) +
    '    <a href="http://cocoadocs.org/docsets/' + entry.id + '/' + entry.version + '">Docs</a>' +
    '    <a href="https://github.com/CocoaPods/Specs/tree/master/' + entry.id + '/' + entry.version + '/' + entry.id + '.podspec">Spec</a>' +
    '  </div>' +
    '</li>'
  };
  
  pickyClient = new PickyClient({
    full: 'http://cocoapods.org/search.json',
    fullResults: 20,
      
    // The live query does a full query.
    //
    live: 'http://cocoapods.org/search.json',
    liveResults: 20,
    liveRendered: true, // Experimental: Render live results as if they were full ones.
    liveSearchInterval: 60, // Time between keystrokes before it sends the query.
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
    counterSelector: '#search form span.amount',
    moreSelector: '#search_results .allocations .more',
    
    // Before a query is inserted into the search field
    // we clean it of any platform terms.
    //
    beforeInsert: function(query) {
      if ('' != query) { prepareSearchInterfaceForResults(); }
      return query.replace(platformRemoverRegexp, '');
    },

    after: function(data, query) {
      // TODO
      // $('.clippy').clippy({
      //   'clippy_path': '/media/clippy.swf'
      // });
    },
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
      if (platformModifier === undefined || platformModifier == '') { return query; }
      return platformModifier + ' ' + query;
    },
    success: function(data, query) {
      // Track query for analytics.
      //
      trackAnalytics(data, query);
      
      // If somebody cleared the search input, do not show any results
      // arriving "late" (well, slower than the person can press backspace).
      //
      if ('' == searchInput.val()) { return false; }
      
      // If no results are found.
      //
      if (0 == data.total) {
        noResultsSearchInterface();
      } else {
        resultsSearchInterface();
      }
      
      // Render the JSON into HTML.
      //
      var allocations = data.allocations;
      allocations.each(function(i, allocation) {
        allocation.entries = allocation.entries.map(function(i, entry) {
          return render(JSON.parse(entry));
        });
      });
      
      return data;
    },
    // after: function(data) { }, // After Picky has handled the data and updated the view.

    // This is used to generate the correct query strings, localized. E.g. "subject:war".
    // Note: If you don't give these, the field identifier given in the Picky server is used.
    //
    qualifiers: {
      en:{
        dependencies: 'uses',
        platform: 'on'
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
    groups: [['platform']],
          
    // This is used for formatting inside the choice groups.
    //
    // Use %n$s, where n is the position of the category in the key.
    // Optional. Default is {}.
    //
    choices: {
      en: {
        'platform': '', // platform is simply never shown.
              
        'name': 'name',
        'author': 'author',
        'summary': 'summary',
        'dependencies': 'dependency',
        'tags': 'tag',
        'version': 'version',
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
        'dependencies,version': 'version+dependencies',
        'version,dependencies': 'version+dependency',
        'author,version': 'author+version',
        'version,author': 'version+author',
        'summary,version': 'version+summary',
        'version,summary': 'version+summary',
        'summary,name': 'summary+name',
        'name,summary': 'name+summary',
        'summary,author': 'summary+author',
        'author,summary': 'author+summary',
        'summary,dependencies': 'summary+dependency',
        'dependencies,summary': 'dependency+summary',
        'name,dependencies': 'name+dependency',
        'dependencies,name': 'dependency+name'
        
        // 'name': 'Called <em>%1$s</em>',
        // 'author': 'Written by <em>%1$s</em>',
        // 'summary': 'Having \"<em>%1$s</em>\" in summary',
        // 'dependencies': 'Using another pod called <em>%1$s</em>',
        // 'tags': 'Tagged <em>%1$s</em>',
        // 'author,name': 'Called <em>%2$s</em>, written by <em>%1$s</em>',
        // 'name,author': 'Called <em>%1$s</em>, written by <em>%2$s</em>',
        // 'tags,name': 'Called <em>%2$s</em>, tagged as <em>%1$s</em>',
        // 'name,tags': 'Called <em>%1$s</em>, tagged as <em>%2$s</em>',
        // 'version,name': '<em>%1$s</em> of <em>%2$s</em>',
        // 'name,dependencies': '<em>%1$s</em>, using <em>%2$s</em>',
        // 'dependencies,name': '<em>%1$s</em> used by <em>%2$s</em>',
        // 'author,dependencies': 'Written by <em>%1$s</em> and using <em>%2$s</em>',
        // 'dependencies,author': 'Using a pod called <em>%1$s</em>, written by <em>%2$s</em>',
        // 'dependencies,version': '<em>%1$s</em> used by version <em>%2$s</em>',
        // 'version,dependencies': '<em>%2$s</em> used by version <em>%1$s</em>',
        // 'author,version': 'Version <em>%2$s</em> by <em>%1$s</em>',
        // 'version,author': 'Version <em>%1$s</em> by <em>%2$s</em>',
        // 'summary,version': 'Version <em>%2$s</em> with \"<em>%1$s</em>\" in summary',
        // 'version,summary': 'Version <em>%1$s</em> with \"<em>%2$s</em>\" in summary',
        // 'summary,name': 'Called <em>%2$s</em>, with \"<em>%1$s</em>\" in summary',
        // 'name,summary': 'Called <em>%1$s</em>, with \"<em>%2$s</em>\" in summary',
        // 'summary,author': 'Written by <em>%2$s</em> with \"<em>%1$s</em>\" in summary',
        // 'author,summary': 'Written by <em>%1$s</em> with \"<em>%2$s</em>\" in summary',
        // 'summary,dependencies': 'Has \"<em>%1$s</em>\" in summary and uses another pod called <em>%2$s</em>',
        // 'dependencies,summary': 'Has \"<em>%2$s</em>\" in summary and uses another pod called <em>%1$s</em>',
        // 'name,dependencies': 'Called \"<em>%1$s</em>\", using another pod called <em>%2$s</em>',
        // 'dependencies,name': 'Called \"<em>%2$s</em>\", using another pod called <em>%1$s</em>'
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
        platform: 'only on',
        summary: 'with summary',
        tags: 'tagged as'
      }
    }
  });
  
  // Reset the search if empty.
  // TODO Use the "search" Event? Also, rewrite.
  //
  searchInput.on('input', function(e) {
    if ('' == this.value) {
      resetSearchInterface();
    } else {
      prepareSearchInterfaceForResults();
    }
  });

  // Resend query on platform selection.
  //
  // Note: Also updates the label.
  //
  platformSelect.find('input').bind('change', function(event) {
    pickyClient.resend();
    selectCheckedPlatform();
    $("#pod_search").focus();
  });

  // Initially select the right platform.
  //
  selectCheckedPlatform();

  // Initially insert the query given in the URL
  // if there is one.
  //
  if (window.initial_query != "") {
    pickyClient.insertFromURL(window.initial_query);
  }
});

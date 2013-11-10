var platformRemoverRegexp = /(platform|on\:\w+\s?)+/;
var platformSelect = $(".platform");
      
// Sets the checkbox labels correctly.
//
var selectCheckedPlatform = function() {
  platformSelect.find('label').removeClass('selected');
  platformSelect.find('input:checked + label').addClass('selected');
};
      
// // Tracking the search results.
// //
// var trackAnalytics = function(data, query) {
// var total = data.total;
// if (total > 0) {
//   _gaq.push(['_trackEvent', 'search', 'with results', query, total]);
// } else {
//   _gaq.push(['_trackEvent', 'search', 'not found', query, 0]);
// }
// }

$(window).ready(function() {
  pickyClient = new PickyClient({
    full: 'http://cocoapods.org/search',
      
    // The live query does a full query.
    //
    live: 'http://cocoapods.org/search',
    liveResults: 20,
    liveRendered: true, // Experimental: Render live results as if they were full ones.
    liveSearchInterval: 60, // Time between keystrokes before it sends the query.

    // Instead of enclosing the search in #picky,
    // in the CocoaPods search we use #search.
    //
    enclosingSelector: '#search',
    resetSelector: 'a.reset-search',
    maxSuggestions: 4,
    moreSelector: '#search .allocations .more',

    // Before a query is inserted into the search field
    // we clean it of any platform terms.
    //
    beforeInsert: function(query) {
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
      query = query.replace(platformRemoverRegexp, '');
      var platformModifier = platformSelect.find("input:checked").val();
      if (platformModifier === undefined || platformModifier == '') { return query; }
      return platformModifier + ' ' + query;
    },
    // We filter duplicate ids here.
    // (Not in the server as it might be
    // used for APIs etc.)
    //
    // We also track the data for analytics.
    //
    success: function(data, query) {
      // TODO trackAnalytics(data, query);
            
      var seen = {};
            
      var allocations = data.allocations;
      allocations.each(function(i, allocation) {
        var ids     = allocation.ids;
        var entries = allocation.entries;
        var remove = [];
              
        ids.each(function(j, id) {
          if (seen[id]) {
            data.total -= 1;
            remove.push(j);
          } else {
            seen[id] = true;
          }
        });
              
        for(var l = remove.length-1; 0 <= l; l--) {
          entries.splice(remove[l], 1);
        }
              
        allocation.entries = entries;
        });
            
      return data;
    },
    // after: function(data, query) {  }, // After Picky has handled the data and updated the view.

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
              
        'name': 'Called <em>%1$s</em>',
        'author': 'Written by <em>%1$s</em>',
        'summary': 'Having \"<em>%1$s</em>\" in summary',
        'dependencies': 'Using <em>%1$s</em>',
        'tags': 'Tagged <em>%1$s</em>',
        'author,name': 'Called <em>%2$s</em>, written by <em>%1$s</em>',
        'name,author': 'Called <em>%1$s</em>, written by <em>%2$s</em>',
        'tags,name': 'Called <em>%2$s</em>, tagged as <em>%1$s</em>',
        'name,tags': 'Called <em>%1$s</em>, tagged as <em>%2$s</em>',
        'version,name': '<em>%1$s</em> of <em>%2$s</em>',
        'name,dependencies': '<em>%1$s</em>, using <em>%2$s</em>',
        'dependencies,name': '<em>%1$s</em> used by <em>%2$s</em>',
        'author,dependencies': 'Written by <em>%1$s</em> and using <em>%2$s</em>',
        'dependencies,author': 'Using <em>%1$s</em>, written by <em>%2$s</em>',
        'dependencies,version': '<em>%1$s</em> used by version <em>%2$s</em>',
        'version,dependencies': '<em>%2$s</em> used by version <em>%1$s</em>',
        'author,version': 'Version <em>%2$s</em> by <em>%1$s</em>',
        'version,author': 'Version <em>%1$s</em> by <em>%2$s</em>',
        'summary,version': 'Version <em>%2$s</em> with \"<em>%1$s</em>\" in summary',
        'version,summary': 'Version <em>%1$s</em> with \"<em>%2$s</em>\" in summary',
        'summary,name': 'Called <em>%2$s</em>, with \"<em>%1$s</em>\" in summary',
        'name,summary': 'Called <em>%1$s</em>, with \"<em>%2$s</em>\" in summary',
        'summary,author': 'Written by <em>%2$s</em> with \"<em>%1$s</em>\" in summary',
        'author,summary': 'Written by <em>%1$s</em> with \"<em>%2$s</em>\" in summary',
        'summary,dependencies': 'Has \"<em>%1$s</em>\" in summary and uses <em>%2$s</em>',
        'dependencies,summary': 'Has \"<em>%2$s</em>\" in summary and uses <em>%1$s</em>',
        'name,dependencies': 'Called \"<em>%1$s</em>\", using <em>%2$s</em>',
        'dependencies,name': 'Called \"<em>%2$s</em>\", using <em>%1$s</em>'
      }
    },

    // This is used to explain the preceding word in the suggestion text (if it
    // has not yet been defined by the choices above), localized. E.g. "Peter (author)".
    // Optional. Default are the field identifiers from the Picky server.
    //
    explanations: {
      en:{
          name: 'named',
          author: 'written by',
          versions: 'on version',
          dependencies: 'using',
          summary: 'with summary',
          tags: 'tagged as'
        }
      }
    }
  );
        
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

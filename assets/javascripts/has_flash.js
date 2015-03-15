function hasFlash() {
  var a = !1,
      b = "";

  function c(d) {
    d = d.match(/[\d]+/g);
    d.length = 3;
    return d.join(".")
  }

  if (navigator.plugins && navigator.plugins.length) {
      var e = navigator.plugins["Shockwave Flash"];
      e && (a = !0, e.description && (b = c(e.description)));
      navigator.plugins["Shockwave Flash 2.0"] && (a = !0, b = "2.0.0.11")
  } else {
      if (navigator.mimeTypes && navigator.mimeTypes.length) {
          var f = navigator.mimeTypes["application/x-shockwave-flash"];
          (a = f && f.enabledPlugin) && (b = c(f.enabledPlugin.description))
      } else {
          try {
              var g = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7"),
                  a = !0,
                  b = c(g.GetVariable("$version"))
          } catch (h) {
              try {
                  g = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6"), a = !0, b = "6.0.21"
              } catch (i) {
                  try {
                      g = new ActiveXObject("ShockwaveFlash.ShockwaveFlash"), a = !0, b = c(g.GetVariable("$version"))
                  } catch (j) {}
              }
          }
      }
  }
  return a;
}
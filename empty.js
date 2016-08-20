function append(promise) {
  promise.marker = {};
  promise.marker.mark = function(p) { return p; };
  promise.marker.topmostAsync = function(p) { return p; };
  promise.marker.checkMarkList = function() {};
}

append(Promise);

try {
  const Promise2 = require("babel-runtime/core-js/promise").default;
  append(Promise2);
} catch (_) {
}

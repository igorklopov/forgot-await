Promise.marker = {};
Promise.marker.mark = function(p) { return p; };
Promise.marker.topmostAsync = function(p) { return p; };
Promise.marker.checkMarkList = function() {};

(function ($, undefined) {
  if(!$) throw Error('dpd.js depends on jQuery.ajax - you must include it before loading dpd.js');

  var BASE_URL = '/';

  function normalizeArray(parts, allowAboveRoot) {
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last == '.') {
        parts.splice(i, 1);
      } else if (last === '..') {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }

    // if the path is allowed to go above the root, restore leading ..s
    if (allowAboveRoot) {
      for (; up--; up) {
        parts.unshift('..');
      }
    }

    return parts;
}

  normalizePath = function(path) {
      var isAbsolute = path.charAt(0) === '/',
          trailingSlash = path.slice(-1) === '/';

      // Normalize the path
      path = normalizeArray(path.split('/').filter(function(p) {
        return !!p;
      }), !isAbsolute).join('/');

      if (!path && !isAbsolute) {
        path = '.';
      }
      if (path && trailingSlash) {
        path += '/';
      }

      return (isAbsolute ? '/' : '') + path;
    };


  function joinPath() {
    var paths = Array.prototype.slice.call(arguments, 0);
    return normalizePath(paths.filter(function(p, index) {
      return p && typeof p === 'string';
    }).join('/'));
  };

  function isComplex(obj) {
    if (obj) {
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          if (typeof obj[k] === 'object') {
            return true;
          }
        }
      }
    }
    return false;
  }

  function encodeIfComplex(query) {
    if (isComplex(query)) {
      return 'q=' + encodeURIComponent(JSON.stringify(query));
    } else if (query) {
      return $.param(query);
    }
  }

  function returnSuccess(fn) {
    return function(data) {
      if (fn) fn(data);
    };
  }

  function returnError(fn) {
    return function(xhr) {
      var error;
      try {
        error = JSON.parse(xhr.responseText);
      } catch (ex) {
        error = {message: xhr.responseText};
      }

      if (fn) fn(null, error);
    }
  }

  var baseMethods = {
    get: function(options, fn) {
      var query = encodeIfComplex(options.query);

      return $.ajax(joinPath(BASE_URL, options.path), {
          type: "GET"
        , data: query
        , success: returnSuccess(fn)
        , error: returnError(fn)
      });
    }
    , post: function(options, fn) {
      var query = encodeIfComplex(options.query);
      if (query) query = '?' + query;
      else query = '';

      return $.ajax(joinPath(BASE_URL, options.path) + query, {
          type: "POST"
        , contentType: "application/json"
        , data: JSON.stringify(options.body)
        , success: returnSuccess(fn)
        , error: returnError(fn)
      });
    }
  }

  function parseGetSignature(args) {
    var settings = {}
      , i = 0;

    if (typeof args[i] === 'string') {
      settings.path = args[i];
      i++;
    }

    if (typeof args[i] === 'object') {
      settings.query = args[i];
      i++;
    }

    settings.fn = args[i];

    return settings;
}

  function parsePostSignature(args) {
    var settings = {}
      , i = 0;

    if (typeof args[i] === 'string') {
      settings.path = args[i];
      i++;
    }

    settings.body = args[i];
    i++;

    if (typeof args[i] === 'object') {
      settings.query = settings.body;
      settings.body = args[i];
      i++;
    }

    settings.fn = args[i];

    return settings;
  }

  window.dpd = function(resource) {

    return {
      get: function(path, query, fn) {
        var settings = parseGetSignature(arguments);
        settings.path = joinPath(resource, settings.path);

        return baseMethods.get(settings, settings.fn);
      }
      , post: function(path, query, body, fn) {
        var settings = parsePostSignature(arguments);
        settings.path = joinPath(resource, settings.path);

        return baseMethods.post(settings, settings.fn);
      }
    };
  };

})(window.jQuery);
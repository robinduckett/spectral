var d, descend, dnode, fnwrap, mkwrap, pageWrap, port, shoe, stream, webpage, _phantom;

var __slice = Array.prototype.slice,
    __hasProp = Object.prototype.hasOwnProperty;

webpage = core_require('webpage');

shoe = require('shoe');

dnode = require('dnode');

port = phantom.args[0];

fnwrap = function(target) {
    return function() {
        return target.apply(this, arguments);
    };
};

descend = function(op, obj, key, val) {
    var cur, keys;
    cur = obj;
    keys = key.split('.');
    while (keys.length > 1) {
        cur = cur[keys.shift()];
    }
    if (op === 'set') cur[keys[0]] = val;
    return cur[keys[0]];
};

mkwrap = function(src, pass, special) {
    var k, obj, _fn, _i, _len;
    if (pass == null) pass = [];
    if (special == null) special = {};
    obj = {
        set: function(key, val, cb) {
            if (cb == null) cb = function() {};
            if (typeof val === "function") val = fnwrap(val);
            return cb(descend('set', src, key, val));
        },
        get: function(key, cb) {
            return cb(descend('get', src, key));
        }
    };
    _fn = function(k) {
        return obj[k] = function() {
            var arg, args, i, _len2;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            for (i = 0, _len2 = args.length; i < _len2; i++) {
                arg = args[i];
                if (typeof arg === 'function') args[i] = fnwrap(arg);
            }
            return src[k].apply(src, args);
        };
    };
    for (_i = 0, _len = pass.length; _i < _len; _i++) {
        k = pass[_i];
        _fn(k);
    }
    for (k in special) {
        if (!__hasProp.call(special, k)) continue;
        obj[k] = special[k];
    }
    return obj;
};

pageWrap = function(page) {
    return mkwrap(page, ['open', 'close', 'includeJs', 'sendEvent', 'release', 'uploadFile', 'close', 'goBack', 'goForward', 'reload'], {
        injectJs: function(js, cb) {
            if (cb == null) cb = function() {};
            return cb(page.injectJs(js));
        },
        evaluate: function() {
            var args, cb, fn;
            fn = arguments[0], cb = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
            if (cb == null) cb = (function() {});
            return cb(page.evaluate.apply(page, [fn].concat(args)));
        },
        render: function(file, cb) {
            if (cb == null) cb = function() {};
            page.render(file);
            return cb();
        },
        renderBase64: function(type, cb) {
            if (cb == null) cb = function() {};
            return cb(page.renderBase64(type));
        },
        setHeaders: function(headers, cb) {
            if (cb == null) cb = function() {};
            page.customHeaders = headers;
            return cb();
        },
        setContent: function(html, url, cb) {
            if (cb == null) cb = function() {};
            page.onLoadFinished = function(status) {
                page.onLoadFinished = null;
                return cb(status);
            };
            return page.setContent(html, url);
        },
        setViewportSize: function(width, height, cb) {
            if (cb == null) cb = function() {};
            page.viewportSize = {
                width: width,
                height: height
            };
            return cb();
        }
    });
};

_phantom = mkwrap(phantom, ['exit'], {
    injectJs: function(js, cb) {
        if (cb == null) cb = function() {};
        return cb(phantom.injectJs(js));
    },
    getCookies: function(cb) {
        if (cb == null) cb = function() {};
        return cb(phantom.cookies);
    },
    addCookie: function(name, value, domain, cb) {
        var cookie;
        if (cb == null) cb = function() {};
        cookie = {
            name: name,
            value: value,
            domain: domain
        };
        return cb(phantom.addCookie(cookie));
    },
    clearCookies: function(cb) {
        if (cb == null) cb = function() {};
        return cb(phantom.clearCookies());
    },
    createPage: function(cb) {
        return cb(pageWrap(webpage.create()));
    }
});

stream = shoe('http://localhost:' + port + '/dnode');

d = dnode(_phantom);

d.pipe(stream);

stream.pipe(d);
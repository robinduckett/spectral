/*jshint node:true, strict:false */

var dnode = require('dnode'),
    http = require('http'),
    shoe = require('shoe'),
    spawn = require('child_process').spawn,
    phantomjs = require('phantomjs'),
    path = require('path'),
    winston = require('winston'),
    EventEmitter = require('events').EventEmitter;
    
function Spectral() {
    EventEmitter.call(this);
    
    this.spectres = [];
    
    this.options = {
        debug: false,
        port: 12300
    };
    
    process.on('exit', function() {
        this.spectres.forEach(function(phantom) {
            phantom.exit();
        });
    }.bind(this));
}

require('util').inherits(Spectral, EventEmitter);

Spectral.prototype.start = function() {
    var bridgePath = path.join(__dirname, 'build', 'bridge.js');
    
    var phantom = spawn(phantomjs.path, this.processArgs.concat([bridgePath, this.options.port]));
    
    phantom.stdout.on('data', function(chunk) {
        winston.info('PhantomJS: %s', chunk.toString());
    }.bind(this));
    
    phantom.stderr.on('data', function(chunk) {
        if (this.options.debug === true) {
            winston.error('PhantomJS: %s', chunk.toString());
        }
    }.bind(this));
    
    return phantom;
};

Spectral.prototype.wrap = function(phantom) {
    phantom._createPage = phantom.createPage;
    
    phantom.createPage = function(callback) {
        phantom._createPage(function(page) {
            page._evaluate = page.evaluate;
            
            page.evaluate = function() {
                var args = Array.prototype.slice.call(arguments);
                var fn = args.shift();
                var cb = args.shift();
                
                return page._evaluate.apply(page, [fn.toString(), cb].concat(args));
            };
            
            callback(page);
        });
    };
};

Spectral.prototype.listening = function() {
    var phantom = this.start();
    
    phantom.on('exit', this.phantomExit.bind(this));
};

Spectral.prototype.phantomExit = function(code, signal) {
    this.server.close();
    
    if (this.phantom) {
        this.spectres = (function() {
            var i = 0,
                len = this.spectres.length,
                results = [];
                
            for (i; i < len; i++) {
                if (this.spectres[i] !== this.phantom) {
                    results.push(this.spectres[i]);
                }
            }
            
            return results;
        }.bind(this))();
    }
    
    this.emit('exit', code, signal);
};

Spectral.prototype.create = function() {
    var args = Array.prototype.slice.call(arguments);
    
    this.processArgs = [];
    this.callback = null;
    this.phantom = null;
    
    args.forEach(function(argument) {
        switch (typeof argument) {
            case 'function':
                this.callback = argument;
                break;
            case 'string':
                this.processArgs.push(argument);
                break;
            case 'object':
                for (var a in argument) {
                    if (argument.hasOwnProperty(a)) {
                        this.options[a] = argument;
                    }
                }
                break;
        }
    }.bind(this));
    
    this.server = http.createServer();
    
    this.server.listen(this.options.port);
    
    this.server.on('listening', this.listening.bind(this));
    
    this.sock = shoe(function(stream) {
        var d = dnode();
        
        d.on('remote', function(phantom) {
            this.wrap(phantom);
            
            this.spectres.push(phantom);
            
            if (typeof this.callback !== "undefined") {
                this.callback(phantom);
            }
        }.bind(this));
        
        d.pipe(stream);
            stream.pipe(d);
    }.bind(this));
    
    this.sock.install(this.server, '/dnode');
};

Spectral.prototype.loadPage = function(url, callback, exit) {
    var exitFunction = function(code, signal) {
        exit(code, signal);
        this.removeListener('exit', exitFunction);
    }.bind(this);
    this.on('exit', exitFunction);
    
    this.create(function(ph) {
        ph.createPage(function(page) {
            page.process = ph;
            
            page.open(url, function(status) {
                callback(page, status);
            });
        });
    });
};

module.exports = Spectral;
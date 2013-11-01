# Spectral

Spectral is a new phantomjs bridge for node, which improves upon the popular `phantom` module
by actually working, and not being written in CoffeeScript.

It also offers improvements by maintaining a compatible API with phantom's own, except provided within NodeJS.

# Installation

`npm install spectral --save-dev`

# Usage

```javascript
    var spectral = require('spectral');

    var page = spectral.create();

    page.settings.userAgent = 'SpecialAgent';

    page.open('http://www.httpuseragent.org', function (status) {
        if (status !== 'success') {
            console.log('Unable to access network');
        } else {
            var ua = page.evaluate(function () {
                return document.getElementById('myagent').textContent;
            });

            console.log(ua);
        }

        spectral.exit();
    });
```

# Usage
```javascript
var spectral = require('spectral');

var page = spectral.create();

page.open('http://www.sample.com', function() {
    page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
        page.evaluate(function() {
            $("button").click();
        });

        spectral.exit()
    });
});
```
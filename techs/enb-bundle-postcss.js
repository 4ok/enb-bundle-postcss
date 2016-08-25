var fs = require('enb/lib/fs/async-fs');
var vow = require('vow');
var path = require('path');
var postcss = require('postcss');
var pimport = require('postcss-import');
var EOL = require('os').EOL;

module.exports = require('enb/lib/build-flow').create()
    .name('enb-bundle-postcss')
    .target('target', '?.css')
    .useSourceFilename('source', '?.post.css')
    .defineOption('plugins')
    .defineOption('sourcemap', false)
    .builder(function(cssFilename) {
        var def = vow.defer(),
            _this = this,
            dirname = _this.node.getDir(),
            filename = path.join(dirname, _this._target);

        return fs.read(cssFilename, 'utf8')
            .then(function(css) {
                postcss([].concat(_this._plugins).concat(pimport()))
                    .process(css, {
                        from: filename,
                        to: filename,
                        map: _this._sourcemap
                    })
                    .then(function(result) {
                        result.warnings().forEach(function(warn) {
                            process.stderr.write(warn.toString());
                        });

                        def.resolve(result);
                    })
                    .catch(function(error) {
                        if (error.name === 'CssSyntaxError') {
                            process.stderr.write(error.message + error.showSourceCode() + EOL);
                        }

                        def.reject(error);
                    })

                return def.promise();
            });
    })
    .createTech();

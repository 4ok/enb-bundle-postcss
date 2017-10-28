var fs      = require('enb/lib/fs/async-fs'),
    vow     = require('vow'),
    path    = require('path'),
    postcss = require('postcss'),
    pimport = require('postcss-import');

module.exports = require('enb/lib/build-flow').create()
    .name('enb-postcss')
    .target('target', '?.css')
    .useSourceFilename('source', '?.post.css')
    .defineOption('plugins')
    .defineOption('parser')
    .defineOption('sourcemap', false)
    .builder(function(cssFilename) {
        var def = vow.defer(),
            _this = this,
            dirname = _this.node.getDir(),
            filename = path.join(dirname, _this._target);

        return fs.read(cssFilename, 'utf8')
            .then(function(css) {
                postcss([pimport()].concat(_this._plugins))
                    .process(css, {
                        from: filename,
                        to: filename,
                        parser: _this._parser,
                        map: _this._sourcemap
                    })
                    .catch(function(error) {
                        if (error.name === 'CssSyntaxError') {
                            process.stderr.write(error.message + error.showSourceCode());

                            return;
                        }

                        throw error;
                    })
                    .then(function(result) {
                        result.warnings().forEach(function(warn) {
                            process.stderr.write(warn.toString());
                        });

                        def.resolve(result);
                    });

                return def.promise();
            });
    })
    .createTech();

'use strict';

var fs = require('fs');
var path = require('path');
var clone = require('gh-clone');
var write = require('write');
var del = require('delete');
var ok = require('log-ok');

var src = 'vendor/site-policy';

del([src, 'sellside', 'flowbot'], function(err) {
  handleError(err);

  clone({repo: 'github/site-policy', dest: src}, function(err) {
    handleError(err);

    ok('cloned github/site-policy');
    copy(src, 'sellside');
    copy(src, 'flowbot');
  });
});

function copy(cwd, name) {
  var destName = name.toLowerCase();
  var files = lookup(cwd);
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    file.relative = file.relative.replace(/github/ig, destName);
    update(file, name);

    var dest = path.join(destName, file.relative);
    write.sync(dest, file.contents);
  }
}

function update(file, name) {
  var str = file.contents.toString();
  str = str.replace(/GITHUB/g, name.toUpperCase());
  str = str.replace(/G[iI]tHub/g, titleize(name));
  str = str.replace(/github/g, name.toLowerCase());
  file.contents = new Buffer(str);
}

function lookup(cwd) {
  function recurse(dir) {
    var files = fs.readdirSync(dir);
    var res = [];

    for (var i = 0; i < files.length; i++) {
      var basename = files[i];
      var file = {cwd: cwd, basename: basename, path: path.join(dir, basename)};
      file.relative = path.relative(cwd, file.path);
      file.stat = fs.statSync(file.path);

      if (/\.git/.test(file.path)) {
        continue;
      }

      if (file.stat.isDirectory()) {
        res = res.concat(recurse(file.path));
      } else {
        file.contents = fs.readFileSync(file.path);
        res.push(file);
      }
    }
    return res;
  }
  return recurse(cwd);
}

function titleize(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function handleError(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
}

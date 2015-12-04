'use strict';

var http = require('http').createServer();
var io = require('socket.io')(http);
var babel = require('babel-core');
var readline = require('readline');


io.on('connection', function(socket) {
  socket.on('evalResult', function(msg) {
    console.log('= ' + msg.result);
  });
});

http.listen(5000, function() {
  console.log('listening on *:5000');
});


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

rl.on('line', function(line) {
  var module = 'Fluxpy';

  var filename = module + '.js';
  var transformed = babel.transform(line, {
    retainLines: true,
    compact: true,
    comments: false,
    filename,
    whitelist: [
      // Keep in sync with packager/react-packager/.babelrc
      'es6.arrowFunctions',
      'es6.blockScoping',
      'es6.classes',
      'es6.constants',
      'es6.destructuring',
      'es6.parameters',
      'es6.properties.computed',
      'es6.properties.shorthand',
      'es6.spread',
      'es6.templateLiterals',
      'es7.asyncFunctions',
      'es7.trailingFunctionCommas',
      'es7.objectRestSpread',
      'flow',
      'react',
      'react.displayName',
      'regenerator',
    ],
    plugins: [],
    sourceFileName: 'Fluxpy.js',
    sourceMaps: false,
    extra: {},
  });

  io.emit('evalIn', { contextName: 'Fluxpy', code: transformed.code });
});

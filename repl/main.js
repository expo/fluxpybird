'use strict';

var http = require('http').createServer();
var io = require('socket.io')(http);
var babel = require('babel-core');
var readline = require('readline');


io.on('connection', function(socket) {
  socket.on('evalResult', function(msg) {
    if (msg.result) {
      console.log('= ' + msg.result);
    }
    if (msg.error) {
      console.log('! ' + msg.error);
    }
    rl.prompt();
  });
  rl.prompt();
});

http.listen(5000, function() {
  console.log('listening on *:5000');
});


var context = 'main';


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', function(line) {
  if (line.startsWith(':context ')) {
    context = line.split(' ')[1];
    console.log('context is now \'' + context + '\'');
    rl.prompt();
    return;
  }

  var filename = context + '.js';
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
    sourceFileName: filename,
    sourceMaps: false,
    extra: {},
  });

  io.emit('evalIn', { contextName: context, code: transformed.code });
});

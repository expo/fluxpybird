'use strict';

var fs = require('fs');

var http = require('http').createServer();
var io = require('socket.io')(http);
var babel = require('babel-core');
var readline = require('readline');


function pretty(msg) {
  if (typeof msg === 'string') {
    return msg;
  } else {
    return JSON.stringify(msg, null, 2);
  }
}


io.on('connection', function(socket) {
  socket.on('evalResult', function(msg) {
    if (msg.result) {
      console.log('= ' + pretty(msg.result));
    }
    if (msg.error) {
      console.log('! ' + msg.error);
    }
    rl.prompt();
  });
  socket.on('log', function(msg) {
    console.log('~ ' + pretty(msg));
    rl.prompt();
  });
  rl.prompt();
});

http.listen(5000, function() {
  console.log('listening on *:5000');
});


var context = 'main';

function transform(code) {
  var filename = context + '.js';
  var transformed = babel.transform(code, {
    retainLines: true,
    compact: true,
    comments: false,
    filename,
    /* whitelist: [
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
       ], */
    plugins: [],
    sourceFileName: filename,
    sourceMaps: false,
  });
  return transformed.code;
}


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

  io.emit('evalIn', { contextName: context, code: transform(line) });
});


fs.watchFile('scratch.js', function(curr) {
  console.log(':run scratch.js');
  fs.readFile('scratch.js', function(err, data) {
    if (err) {
      throw err;
    }
    io.emit('evalIn', { contextName: context, code: transform(data) });
  });
});

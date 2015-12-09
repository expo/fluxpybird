'use strict';

// Need this to make ''socket.io-client' work
// http://browniefed.com/blog/2015/05/16/react-native-and-socket-dot-io/
if (!window.navigator.userAgent) {
  window.navigator.userAgent = 'react-native';
}
const io = require('socket.io-client/socket.io');


const evalMap = {};

/*
 * Register a context-bound evaluator. `contextName` is the name the context
 * will be looked up by in `evalIn(...)` or `queueEvalIn(...)`. `evaluator`
 * should be a function that evaluates its JavaScript code string argument in
 * the desired context and returns the result. This is usually `(code) =>
 * eval(code)` so that it closes over the desired context.
 */
const registerEval = (contextName, evaluator) => {
  evalMap[contextName] = evaluator;
};

/*
 * Evaluate the string of JavaScript code `code` in the context named
 * `contextName`. The context should have been previously registered with
 * `registerEval(...)`. This runs the code synchronously in the thread where
 * `evalIn(...)` is called. Use `queueEvalIn` to run on next flush of queued
 * evals (usually on the next `'TICK'`).
 */
const evalIn = (contextName, code) => {
  if (!evalMap[contextName]) {
    throw new Error(`Evaluator context '${contextName}' not registered ` +
                    ` for evalIn(...)`);
  }
  return evalMap[contextName](code);
};

const evalInQueue = [];

/*
 * Like `evalIn(...)`, except it queues the code for execution the next time the
 * eval queue is flushed (usually on the next `'TICK'`).
 */
const queueEvalIn = (contextName, code) => {
  evalInQueue.push({ contextName, code });
};

/*
 * Flush the queued-up evals since the last flush or since the birth of the
 * process. This runs all the evals in order queued, synchronously in the thread
 * where the function is called. It logs the value of each eval to the console.
 * Usually you want to call this once each `'TICK'`.
 */
const flushEvalInQueue = () => {
  evalInQueue.forEach(({ module, code}) => {
    console.log(window.evalIn(module, code));
  });
  evalInQueue.length = 0;
};

/*
 * Connect to the REPL server.
 */
let socket;
const connect = (url = 'http://nikhileshs-air.local:5000') => {
  socket = io(url, { jsonp: false });

  socket.on('evalIn', ({ contextName, code }) => {
    let result;
    let error;
    try {
      result = evalIn(contextName, code);
    } catch (ex) {
      error = ex.toString();
    }
    socket.emit('evalResult', { result, error });
  });
};

/*
 * Log to the REPL server.
 */
const log = (obj) => {
  socket.emit('log', obj);
};

const repl = {
  evalIn,
  queueEvalIn,
  registerEval,
  flushEvalInQueue,
  connect,
  log,
};

window.repl = repl;

export default repl;

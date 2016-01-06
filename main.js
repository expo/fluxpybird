'use strict';

import React, {
  AppRegistry,
  PanResponder,
  View,
} from 'react-native';

import { connect, Provider } from 'react-redux/native';
import { createStore } from 'redux';

import Styles from './Styles';


import REPL from './REPL';

REPL.registerEval('main', (c) => eval(c));


// Import from a different module for a different game!
import { sceneReduce, Scene } from './Fluxpy';


/**
 * Touch
 *
 * Event handler that dispatches
 * `{ ...gestureState, type: 'TOUCH', pressed: <whether pressed> }`
 * on touch events, where `gestureState` is given as in
 * https://facebook.github.io/react-native/docs/panresponder.html. Doesn't
 * actually render anything.
 */

const Touch = connect()(
  ({ dispatch, children, ...props }) => {
    const panGrant = (_, gestureState) =>
      dispatch({ ...gestureState, type: 'TOUCH', pressed: true });
    const panRelease = (_, gestureState) =>
      dispatch({ ...gestureState, type: 'TOUCH', pressed: false });
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: panGrant,
      onPanResponderRelease: panRelease,
      onPanResponderTerminate: panRelease,
      onShouldBlockNativeResponder: () => false,
    });

    return (
      <View
        {...props}
        {...panResponder.panHandlers}
        style={{ ...props.style, flex: 1 }}>
        {children}
      </View>
    );
  }
);


/**
 * Clock
 *
 * Event handler that dispatches
 * `{ type: 'TICK', dt: <seconds since last tick> }`
 * per animation frame. Doesn't actually render anything.
 */

@connect()
class Clock extends React.Component {
  componentDidMount() {
    this._requestTick();
  }

  componentWillUnmount() {
    if (this._tickRequestID) {
      window.cancelAnimationFrame(this._tickRequestID);
    }
  }

  _requestTick() {
    if (!this._lastTickTime) {
      this._lastTickTime = Date.now();
    }
    this._tickRequestID = requestAnimationFrame(this._tick.bind(this));
  }

  _tick() {
    this._tickRequestID = undefined;
    const currTime = Date.now();
    this.tick(Math.min(0.05, 0.001 * (currTime - this._lastTickTime)));
    this._lastTickTime = currTime;
    this._requestTick();
  }

  tick(dt) {
    this.props.dispatch({ type: 'TICK', dt });
  }

  render() {
    return null;
  }
}


/**
 * Game
 *
 * Brings together event handlers and the Scene.
 */

const Game = () => (
  <View style={Styles.container}>
    <Clock />
    <Scene />
    <Touch style={Styles.container}/>
  </View>
);


/**
 * Main
 *
 * Initializes a Redux store and provides it to Game.
 */

const dispatchQueue = [];

const queueDispatch = (action) => dispatchQueue.push(action);

const mainReduce = (state, action) => {
  if (action.type === 'TICK') {
    REPL.flushEvalInQueue();
  }

  const actions = [action].concat(dispatchQueue);
  dispatchQueue.length = 0;
  const dispatch = (action) => actions.push(action);
  while (actions.length > 0) {
    state = sceneReduce(state, actions.shift(), dispatch);
  }
  return state;
};

const Main = () => {
  REPL.connect();

  const store = createStore(mainReduce,
                            mainReduce(undefined, { type: 'START' }));
  return (
    <Provider store={store}>
      {() => <Game />}
    </Provider>
  );
};

AppRegistry.registerComponent('main', () => Main);

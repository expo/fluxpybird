'use strict';

const React = require('react-native');
const {
  AppRegistry,
  PanResponder,
  View,
} = React;

const { connect, Provider } = require('react-redux/native');
const { createStore } = require('redux');

const REPL = require('./REPL');

REPL.registerEval('main', (c) => eval(c));


// Import from a different module for a different game!
import { Scene } from './Fluxpy';
import { store } from './Flux';

/**
 * Touch
 *
 * Event handler that dispatches
 * `{ ...gestureState, type: 'TOUCH', pressed: <whether pressed> }`
 * on touch events, where `gestureState` is given as in
 * https://facebook.github.io/react-native/docs/panresponder.html. Doesn't
 * actually render anything.
 */

const Touch = (props) => {
    const panGrant = (_, gestureState) =>
      store.dispatch({ ...gestureState, type: 'TOUCH', pressed: true });
    const panRelease = (_, gestureState) =>
      store.dispatch({ ...gestureState, type: 'TOUCH', pressed: false });
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: panGrant,
      onPanResponderRelease: panRelease,
      onShouldBlockNativeResponder: () => false,
    });

    return (
      <View
        {...props}
        {...panResponder.panHandlers}
        style={{ ...props.style, flex: 1 }}>
        {props.children}
      </View>
    );
}


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
    this._tickCount = 0;
    this._mountTime = new Date();
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
    this._tickCount = this._tickCount + 1;
    console.log(`${this._tickCount/(((new Date()) - this._mountTime) * 0.001)} ticks/s`);
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
  <Touch>
    <Clock />
    <Scene />
  </Touch>
);


/**
 * Main
 *
 * Initializes a Redux store and provides it to Game.
 */


const Main = () => {
  REPL.connect();

  return (
    <Provider store={store}>
      {() => <Game />}
    </Provider>
  );
};

AppRegistry.registerComponent('main', () => Main);

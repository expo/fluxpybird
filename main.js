/**
 * Main component
 */
'use strict';

import React from 'react-native';
const {
  AppRegistry,
  PanResponder,
  StyleSheet,
  Text,
  View,
} = React;

import { connect, Provider } from 'react-redux/native';
import { createStore } from 'redux';


/**
 * reduce
 */

const reduce = (state, action) => {
  switch (action.type) {
    case 'START':
      return {
        time: 0,
        touching: false,
      };

    case 'TICK':
      return {
        ...state,
        time: state.time + action.dt,
      };

    case 'TOUCH':
      return {
        ...state,
        touching: action.pressed,
      };

    default:
      return state;
  }
};


/**
 * Scene
 */

const Scene = connect(
  ({ time, touching }) => ({ time, touching })
)(
  ({ time, touching }) => (
    <View style={[sceneStyles.container, {
        backgroundColor: touching ? '#000' : '#fff',
      }]}>
      <Text style={{ color: touching ? '#fff' : '#000' }}>
        {Math.floor(time)} SECOND{1 <= time && time < 2 ? '' : 'S'} PASSED
      </Text>
    </View>
  )
);

const sceneStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


/**
 * Touch
 *
 * Event handler that dispatches { type: 'TOUCH', pressed: <whether pressed> }
 * on touch events. Doesn't actually render anything.
 */

const Touch = connect()(
  ({ dispatch, children, ...props }) => {
    let panGrant = () => dispatch({ type: 'TOUCH', pressed: true });
    let panRelease = () => dispatch({ type: 'TOUCH', pressed: false });
    let panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: panGrant,
      onPanResponderRelease: panRelease,
      onPanResponderTerminate: panRelease,
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
 * Event handler that dispatches { type: 'TICK', dt: <seconds since last tick> }
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
    let currTime = Date.now();
    this.tick(0.001 * (currTime - this._lastTickTime));
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

const Game = connect()(
  () => (
    <Touch>
      <Clock />
      <Scene />
    </Touch>
  )
);


/**
 * Main
 *
 * Initializes a Redux store and provides it to Game.
 */

const Main = () => {
  let store = createStore(reduce, reduce(null, { type: 'START' }));
  return (
    <Provider store={store}>
      {() => <Game />}
    </Provider>
  );
};

AppRegistry.registerComponent('main', () => Main);

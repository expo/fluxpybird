/**
 * Main component
 */
'use strict';

import React from 'react-native';
const {
  AppRegistry,
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
        count: 0,
        time: 0,
      };

    case 'TICK':
      return {
        ...state,
        time: state.time + action.dt,
      };

    case 'CLICK':
      return {
        ...state,
        count: state.count + 1,
      };

    default:
      return state;
  }
};


/**
 * Game
 */

const Game = connect(
  ({ time, count }) => ({ time, count })
)(
  ({ dispatch, time, count }) => (
    <View style={gameStyles.container}>
      <Clock />
      <Text>
        {Math.floor(time)} SECOND{1 <= time && time < 2 ? '' : 'S'} PASSED
      </Text>
      <Text onPress={() => dispatch({ type: 'CLICK' })}>
        YOU CLICKED ME {count} TIME{count === 1 ? '' : 'S'}!
      </Text>
    </View>
  )
);

const gameStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


/**
 * Clock
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
 * Main
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

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
 * State / Reduce
 */

const start = {
  count: 0,
};

const reduce = (state, action) => {
  switch (action.type) {
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
 * Render
 */

const Game = connect(
  ({ count }) => ({ count })
)(
  ({ count, dispatch }) => (
    <View style={styles.gameContainer}>
      <Text onPress={() => dispatch({ type: 'CLICK' })}>
        YOU CLICKED ME {count} TIME{count === 1 ? '' : 'S'}!
      </Text>
    </View>
  )
);

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


/**
 * Main
 */

const Main = () => (
  <Provider store={createStore(reduce, start)}>
    {() => <Game />}
  </Provider>
);

AppRegistry.registerComponent('main', () => Main);

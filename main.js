/**
 * Main component
 */
'use strict';

let React = require('react-native');
let {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} = React;

class Main extends React.Component {
  render() {
    return (
      <View
        style={styles.container}>
        <Text>
          HELLO WORLD!
        </Text>
      </View>
    );
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

AppRegistry.registerComponent('main', () => Main);

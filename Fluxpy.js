'use strict';

const React = require('react-native');
const {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} = React;

const Immutable = require('seamless-immutable');

const { connect } = require('react-redux/native');
const Dimensions = require('Dimensions');
const WithCustomFont = require('@exponent/with-custom-font');

const Media = require('./Media');

const REPL = require('./REPL');
import { store } from './Flux';

REPL.registerEval('Fluxpy', (c) => eval(c));


const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;



/**
 * Sprite
 *
 * Render an Image with absolute position.
 */

class Sprite extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pos: new Animated.ValueXY({ x: props.x, y: props.y }),
      rot: props.rot !== undefined ? new Animated.Value(props.rot) : undefined,
    };
  }

  componentWillReceiveProps({ x, y, rot }) {
    if (x !== this.props.x) {
      this.state.pos.x.setValue(x);
    }

    if (y !== this.props.y) {
      this.state.pos.y.setValue(y);
    }

    // if (rot) {
    //   this.state.rot.setValue(rot);
    // }
  }

  shouldComponentUpdate(nextProps) {
    return false;
  }

  render() {
    let { pos, rot } = this.state;
    let { img, w, h } = this.props;
    let transform;
    // if (rot) {
    //   transform = [{
    //     rotate: rot.interpolate({
    //       inputRange: [0, 360],
    //       outputRange: ['0deg', '360deg'],
    //     }),
    //   }];
    // }

    return (
      <Animated.Image
        id={(this.props.id ? this.props.id : '-') + this.props.img}
        style={{ position: 'absolute',
                 ...pos.getLayout(),
                 width: w, height: h,
                 backgroundColor: 'transparent' }}
        source={{ uri: Media[img] }}
      />
    );
  }
}

class Bird extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentWillMount() {
    store.subscribe(() => {
      this.setState({bird: store.getState().bird});
    });
  }

  render() {
    if (!this.state.bird) {
      return <View />;
    }

    let { x, y, w, h, vx, vy } = this.state.bird;
    const rot = parseInt(Math.max(-25, Math.min(vy / (vy > 0 ? 9 : 6), 50)), 10);

    return (
      <Sprite
        key="bird-sprite"
        {...{x: parseInt(x - w / 2, 10), y: parseInt(y - h / 2, 10), rot, w, h, img: 'floaty.png' }}
      />
    );
  }
}

// const Bird = connect(
//   ({ bird }) => bird
// )(
//   ({ x, y, w, h, vx, vy }) => {
//     const rot = Math.max(-25, Math.min(vy / (vy > 0 ? 9 : 6), 50));
//     return (
//       <Sprite
//         key="bird-sprite"
//         {...{x: x - w / 2, y: y - h / 2, rot, w, h, img: 'floaty.png' }}
//       />
//     );
//   }
// );


const pipeImgs = [
  'pillar-1.png',
  'pillar-2.png',
];

// Ensure a constant-ish number of components by rendering extra
// off-screen pipes
let maxNumPipes = pipeImgs.reduce((o, img) => ({ ...o, [img]: 5 }), {});

const defaultPipe = {
  x: SCREEN_WIDTH + 2, y: -2,
  w: 58, h: 800,
  bottom: false,
};


class Pipes extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentWillMount() {
    store.subscribe(() => {
      let { pipes: { cursor, pipes } } = store.getState();
      this.setState({cursor, pipes});
    });
  }

  render() {
    if (!this.state.pipes) {
      return <View />;
    }

    let { cursor, pipes } = this.state;
    const numPipes = pipes.reduce((o, { img }) => (
      { ...o, [img]: o[img] ? o[img] + 1 : 1 }
    ), {});
    // const extraPipes = pipeImgs.reduce((a, img) => {
    //   maxNumPipes[img] = Math.max(maxNumPipes[img], numPipes[img] || 0);
    //   return a.concat(Array(maxNumPipes[img] - (numPipes[img] || 0)).fill(
    //     { ...defaultPipe, img }
    //   ));
    // }, []);
    const keys = pipeImgs.reduce((o, img) => ({ ...o, [img]: 0 }), {});
    return (
      <View
        renderToHardwareTextureAndroid
        key="pipes-container"
        style={styles.container}>
        {
          [
            ...pipes,
            // ...extraPipes,
          ].map(({ x, y, w, h, bottom, img, guid }) => (
            <Sprite
              id='pipe'
              key={guid}
              {...{x: parseInt(x), y: parseInt(bottom ? y : y - h), w, h, img }}
            />
          ))
        }
      </View>
    );
  }
}

// const Pipes = connect(
//   ({ pipes: { cursor, pipes } }) => Immutable({ cursor, pipes })
// )(
//   ({ cursor, pipes }) => {
//   }
// );
// 

const WithScoreFont = WithCustomFont.createCustomFontComponent({
  uri: 'https://dl.dropboxusercontent.com/u/535792/exponent/floaty-font.ttf',
});

const Score = connect(
  ({ splash, score }) => Immutable({ splash, score: Math.floor(score) })
)(
  ({ splash, score }) => {
    if (splash) {
      return <View>{null}</View>;
    }

    return (
      <WithScoreFont>
        <View style={styles.scoreContainer}>
          <Text
            key="score-text"
            style={styles.score}>
            {score}
          </Text>
        </View>
      </WithScoreFont>
    );
  }
);

const CLOUD_WIDTH = 283;
const CLOUD_HEIGHT = 142;

class Clouds extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentWillMount() {
    store.subscribe(() => {
      let { clouds } = store.getState();
      this.setState({clouds: clouds && clouds.clouds});
    });
  }

  render() {
    if (!this.state.clouds) {
      return <View />;
    }

    let { clouds } = this.state;

    return (
      <View
        key="clouds-container"
        style={styles.container}>
        {
          clouds.asMutable().map(({ x, y, img, guid }) => (
            <Sprite
              id='cloud'
              key={guid}
              {...{x: parseInt(x), y: parseInt(y), img, w: CLOUD_WIDTH, h: CLOUD_HEIGHT }}
            />
          ))
        }
      </View>
    );
  }
}

// const Clouds = connect(
//   ({ clouds: { clouds }}) => Immutable({ clouds })
// )(
//   ({ clouds }) => {
//     return (
//       <View
//         key="clouds-container"
//         style={styles.container}>
//         {
//           clouds.asMutable().map(({ x, y, img }) => (
//             <Sprite
//               key={`cloud-sprite-${img}`}
//               {...{x, y, img, w: CLOUD_WIDTH, h: CLOUD_HEIGHT }}
//             />
//           ))
//         }
//       </View>
//     );
//   }
// );


/**
 * Splash
 */

const Splash = connect(
  ({ splash }) => Immutable({ splash })
)(
  ({ splash }) => {
    if (!splash) {
      return <View key="splash-empty">{null}</View>;
    }

    const w = 398, h = 202;
    return (
      <Sprite
        key="splash-sprite"
        x={(SCREEN_WIDTH - w) / 2} y={100}
        w={w} h={h}
        img={'splash.png'}
      />
    );
  }
);



const Scene = () => (
  <View
    style={[styles.container, { backgroundColor: '#F5FCFF' }]}>
    <Pipes />
    <Bird />
    <Splash />
    <Score />
  </View>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0, left: 0,
    width: SCREEN_WIDTH, height: SCREEN_HEIGHT,
  },
  scoreContainer: {
    position: 'absolute',
    top: 42,
    left: 30,
    paddingRight: 2,
    paddingLeft: 5,
    paddingTop: 2,
    backgroundColor: '#363029',
  },
  score: {
    color: '#fcfaf8',
    fontSize: 33,
    fontFamily: '04b_19',
    backgroundColor: 'transparent',
    margin: -1,
  },
});

export default {
  Scene,
};

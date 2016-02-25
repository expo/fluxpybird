'use strict';

import React, {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { connect } from 'react-redux/native';
import Immutable from 'seamless-immutable';
import WithCustomFont from '@exponent/with-custom-font';

import Media from './Media';
import Styles from './Styles';

import REPL from './REPL';

REPL.registerEval('Fluxpy', (c) => eval(c));


/*
 * Return a reducer that runs the reducer `reductions[action]`, defaulting to
 * `reductions.DEFAULT` if not found.
 */
const defaultReducer = (reductions) => (state, action, ...rest) =>
  (reductions[action.type] || reductions.DEFAULT)(state, action, ...rest);


/**
 * Bird
 *
 * Bird's (x, y) is position of its center
 */

const BIRD_FREQ = 1.2;
const BIRD_AMP = 140;

let GHOST = false;

const birdReduce = defaultReducer({
  START() {
    return Immutable({
      time: 0,
      alive: true,
      x: Styles.screenW - 280,
      y: Styles.screenH / 2,
      w: 41, h: 29,
      vx: 110, vy: 0,
      ay: 700, ax: 9,
    });
  },

  TICK({ splash, bird, pipes: { pipes } }, { dt }, dispatch) {
    let die = false;
    if (bird.alive) {
      if (bird.y < 0 || bird.y + bird.h > Styles.screenH) {
        die = true;
      }
      if (!GHOST && pipes.some(({ x, y, w, bottom }) => (
        x + w > bird.x - bird.w / 2 &&
        x < bird.x + bird.w / 2 &&
        (bottom ?
         bird.y + bird.h / 2 > y :
         bird.y - bird.h / 2 < y)
      ))) {
        die = true;
      }
    } else {
      if (bird.y > Styles.screenH + 400) {
        dispatch({ type: 'START' });
      }
    }

    let vy = bird.vy;
    if (GHOST || splash) {
      vy = BIRD_AMP * Math.sin(BIRD_FREQ * Math.PI * bird.time);
    } else if (die) {
      vy = -150;
    } else {
      vy += bird.ay * dt;
    }

    return bird.merge({
      time: bird.time + dt,
      alive: bird.alive && !die,
      y: bird.y + bird.vy * dt,
      x: bird.alive ? bird.x : bird.x - 0.5 * bird.vx * dt,
      vx: splash ? bird.vx : Math.max(0, bird.vx + bird.ax * dt),
      vy,
      ax: (die ?
           Math.min(-bird.vx / 2, -0.25 * bird.vx * bird.vx / (bird.x - bird.w)) :
           bird.ax),
      ay: die ? 700 : bird.ay,
    });
  },

  TOUCH({ bird }, { pressed }) {
    return bird.merge({
      ay: bird.alive && pressed ? -1600 : 700,
    });
  },

  DEFAULT({ bird }) {
    return bird;
  },
});

const Bird = connect(
  ({ bird }) => bird
)(
  ({ x, y, w, h, vx, vy }) => {
    const rot = Math.max(-25, Math.min(vy / (vy > 0 ? 9 : 6), 50));
    return (
      <Image
        key="bird-image"
        style={{ position: 'absolute',
                 transform: [{ rotate: rot + 'deg' }],
                 left: x - w / 2, top: y - h / 2,
                 width: w, height: h,
                 backgroundColor: 'transparent' }}
        source={{ uri: Media['floaty.png'] }}
      />
    );
  }
);


/**
 * Pipes
 *
 * A pipe's (x, y) is where the left corner of its 'surface' is (bottom edge for
 * top-pipe, top edge for bottom-pipe)
 */

const defaultPipe = {
  x: Styles.screenW + 2, y: -2,
  w: 58, h: 800,
  bottom: false,
};

const pipeImgs = [
  'pillar-1.png',
  'pillar-2.png',
];

const pickPipeImg = () =>
  pipeImgs[Math.floor(pipeImgs.length * Math.random())];

const pipesReduce = defaultReducer({
  START() {
    return Immutable({
      cursor: 100,
      cursorDir: Math.random() < 0.5,
      cursorFlipTime: Math.random(),
      distance: 120,
      pipes: [],
    });
  },

  TICK({ splash, bird, pipes }, { dt }, dispatch) {
    if (splash) {
      return pipes;
    }

    if (pipes.distance < 0) {
      dispatch({ type: 'ADD_PIPES' });
    }

    let cursorV = Math.random() * (pipes.cursorDir ? 1 : -1) * 220;
    let cursorDir;
    if (pipes.cursor < 40) {
      cursorDir = true;
    } else if (pipes.cursor > Styles.screenH - 340) {
      cursorDir = false;
    } else {
      cursorDir = (pipes.cursorFlipTime < 0 ?
                   !pipes.cursorDir :
                   pipes.cursorDir);
    }

    return pipes.merge({
      cursor: (pipes.cursor + cursorV * dt),
      cursorFlipTime: (pipes.cursorFlipTime < 0 ?
                       2.2 * Math.random() :
                       pipes.cursorFlipTime - dt),
      cursorDir,

      distance: (pipes.distance < 0 ?
                 240 * Math.random() + 70 :
                 pipes.distance - bird.vx * dt),
      pipes: pipes.pipes.map((pipe) => pipe.merge({
        x: pipe.x - bird.vx * dt,
      })).filter((pipe) => pipe.x + pipe.w > 0),
    });
  },

  ADD_PIPES({ pipes }) {
    const gap = 200 + 100 * Math.random();
    const top = pipes.cursor + 100 * Math.random();
    return pipes.merge({
      pipes: pipes.pipes.concat([
        { ...defaultPipe, y: top, bottom: false, img: pickPipeImg() },
        { ...defaultPipe, y: top + gap, bottom: true, img: pickPipeImg() },
      ]),
    });
  },

  DEFAULT({ pipes }) {
    return pipes;
  },
});

// Ensure a constant-ish number of components by rendering extra
// off-screen pipes
let maxNumPipes = pipeImgs.reduce((o, img) => ({ ...o, [img]: 10 }), {});
const Pipes = connect(
  ({ pipes: { cursor, pipes } }) => Immutable({ cursor, pipes })
)(
  ({ cursor, pipes }) => {
    const pipesByImg = {};
    pipeImgs.forEach((img) => pipesByImg[img] = []);
    pipes.forEach((pipe) => pipesByImg[pipe.img].push(pipe));
    pipeImgs.forEach((img) => {
      const extraPipe = { ...defaultPipe, img };
      maxNumPipes[img] = Math.max(maxNumPipes[img], pipesByImg[img].length);
      while (pipesByImg[img].length < maxNumPipes[img]) {
        pipesByImg[img].push(extraPipe);
      }
    });
    const elems = [];
    pipeImgs.forEach((img) => {
      pipesByImg[img].forEach(({ x, y, w, h, bottom, img }, i) => {
        elems.push(
          <Image
            key={`pipe-image-${img}-${i}`}
            style={{ position: 'absolute',
                     left: x, top: bottom ? y : y - h,
                     width: 800, height: 800,
                     backgroundColor: 'transparent' }}
            source={{ uri: Media[img] }}
          />
        );
      });
    });
    return (
      <View
        key="pipes-container"
        style={Styles.container}>
        {elems}
      </View>
    );
  }
);


/**
 * Score
 */

const scoreReduce = defaultReducer({
  START() {
    return 0;
  },

  TICK({ splash, score }, { dt }) {
    return splash ? score : score + dt;
  },

  DEFAULT({ score }) {
    return score;
  },
});

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


/**
 * Clouds
 */

const cloudImgs = [
  'cloud-1.png',
  'cloud-2.png',
  'cloud-3.png',
  'cloud-4.png',
];

const CLOUD_WIDTH = 283;
const CLOUD_HEIGHT = 142;

const cloudReduce = defaultReducer({
  START() {
    return Immutable({
      clouds: cloudImgs.map((img) => ({
        x: Styles.screenW * 3 * Math.random(),
        y: Styles.screenH * Math.random() - CLOUD_HEIGHT / 2,
        vxFactor: 0.1 + 0.2 * Math.random(),
        img,
      })),
    });
  },

  TICK({ bird, clouds }, { dt }, dispatch) {
    return clouds.merge({
      clouds: clouds.clouds.map((cloud) => {
        if (cloud.x + CLOUD_WIDTH > 0) {
          return cloud.merge({
            x: cloud.x - cloud.vxFactor * (bird.vx + 65) * dt,
          });
        }
        return cloud.merge({
          x: Styles.screenW * (1 + Math.random()),
          y: Styles.screenH * Math.random() - CLOUD_HEIGHT / 2,
          vxFactor: 0.2 + 0.2 * Math.random(),
        });
      }),
    });
  },

  DEFAULT({ clouds }) {
    return clouds;
  },
});

const Clouds = connect(
  ({ clouds: { clouds }}) => Immutable({ clouds })
)(
  ({ clouds }) => {
    return (
      <View
        key="clouds-container"
        style={Styles.container}>
        {
          clouds.asMutable().map(({ x, y, img }) => (
            <Image
              key={`cloud-image-${img}`}
              style={{ position: 'absolute',
                       left: x, top: y,
                       width: CLOUD_WIDTH, height: CLOUD_HEIGHT,
                       backgroundColor: 'transparent' }}
              source={{ uri: Media[img] }}
            />
          ))
        }
      </View>
    );
  }
);


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
      <Image
        key="splash-image"
        style={{ position: 'absolute',
                 left: (Styles.screenW - w) / 2, top: 100,
                 width: w, height: h,
                 backgroundColor: 'transparent' }}
        source={{ uri: Media['splash.png'] }}
      />
    );
  }
);


/**
 * Rewind
 */

const Rewind = connect(
  ({ reverse }) => Immutable({ reverse })
)(
  ({ reverse }) => {
    if (!reverse) {
      return <View key="rewind-empty">{null}</View>;
    }

    const w = 36, h = 36;
    return (
      <Image
        key="rewind-image"
        style={{ position: 'absolute',
                 left: (Styles.screenW - 30 - w), top: 42,
                 width: w, height: h,
                 backgroundColor: '#f00' }}
        source={{ uri: Media['rewind.png'] }}
      />
    );
  }
);


/**
 * Fluxpy
 */

const sceneReduce = (state = Immutable({}), action, dispatch) => {
  let newState = state.merge({ parent: state });

  switch (action.type) {
    case 'START':
      // No parent when re-starting
      newState = Immutable({
        splash: true,
      });
      break;

    case 'TICK':
      // If in reverse mode, abort and return the parent (also in reverse mode)
      if (state.reverse) {
        if (!state.parent) {
          return state;
        }
        return state.parent.merge({ reverse: true });
      }
      break;

    case 'TOUCH':
      newState = newState.merge({
        splash: state.splash && !action.pressed,
        reverse: action.pressed && !state.bird.alive,
      });
      break;
  }

  return newState.merge({
    bird: birdReduce(state, action, dispatch),
    pipes: pipesReduce(state, action, dispatch),
    score: scoreReduce(state, action, dispatch),
    clouds: cloudReduce(state, action, dispatch),
  });
};

const Scene = () => (
  <View
    key="scene-container"
    style={[Styles.container, { backgroundColor: '#f5fcff' }]}>
    <Clouds />
    <Pipes />
    <Bird />
    <Score />
    <Rewind />
    <Splash />
  </View>
);


const styles = StyleSheet.create({
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

export {
  sceneReduce,
  Scene,
};

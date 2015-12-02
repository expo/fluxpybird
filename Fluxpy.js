'use strict';

import React from 'react-native';
const {
  Image,
  StyleSheet,
  Text,
  View,
} = React;

import { connect } from 'react-redux/native';
import Dimensions from 'Dimensions';
import Immutable from 'seamless-immutable';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;


/*
 * Return a reducer that runs the reducer `reductions[action]`, defaulting to
 * `reductions.DEFAULT` if not found.
 */
const defaultReducer = (reductions) => (state, action, ...rest) => (
  (reductions[action.type] || reductions.DEFAULT)(state, action, ...rest)
);


/**
 * Bird
 *
 * Bird's (x, y) is position of its center
 */

const birdReduce = defaultReducer({
  START() {
    return Immutable({
      time: 0,
      alive: true,
      x: SCREEN_WIDTH - 280,
      y: SCREEN_HEIGHT / 2,
      w: 41, h: 29,
      vy: 0, vx: 110,
      ay: 700,
    });
  },

  TICK({ splash, bird, pipes: { pipes } }, { dt }, dispatch) {
    let die = false;
    if (bird.alive) {
      if (bird.y < 0 || bird.y + bird.h > SCREEN_HEIGHT) {
        die = true;
      }
      if (
        pipes.some(pipe => {
          if (pipe.x + pipe.w > bird.x - bird.w / 2 &&
            pipe.x < bird.x + bird.w / 2) {
              return pipe.bottom ?
                     bird.y + bird.h / 2 > pipe.y :
                     bird.y - bird.h / 2 < pipe.y;
          }})
      ) {
        die = true;
      }
    } else {
      if (bird.y > SCREEN_HEIGHT + 400) {
        dispatch({ type: 'START' });
      }
    }

    let vy;
    if (splash) {
      vy = 140 * Math.sin(1.2 * Math.PI * bird.time);
    } else if (die) {
      vy = -150;
    } else {
      vy = bird.vy + bird.ay * dt;
    }

    return bird.merge({
      time: bird.time + dt,
      alive: bird.alive && !die,
      y: bird.y + bird.vy * dt,
      vy,
      vx: bird.vx + 9 * dt,
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
  ({ bird }) => (Immutable({ bird }))
)(
  ({ bird }) => {
    const rot = Math.max(-25, Math.min(bird.vy / (bird.vy > 0 ? 9 : 6), 50));
    return (
      <Image
        key="bird"
        style={{ position: 'absolute',
                 transform: [{ rotate: rot + 'deg' }],
                 left: bird.x - bird.w / 2,
                 top: bird.y - bird.h / 2,
                 width: bird.w,
                 height: bird.h,
                 backgroundColor: 'transparent' }}
        source={{ uri: 'http://i.imgur.com/aAWCxNv.png' }}/>
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
  x: SCREEN_WIDTH + 2, y: -2,
  w: 60, h: 800,
  bottom: false,
};

const pipesReduce = defaultReducer({
  START() {
    return Immutable({
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
    return pipes.merge({
      distance: (pipes.distance < 0 ?
                 240 * Math.random() + 70 :
                 pipes.distance - bird.vx * dt),
      pipes: pipes.pipes.map((pipe) => ({
        ...pipe,
        x: pipe.x - bird.vx * dt,
      })).filter((pipe) => pipe.x + pipe.w > 0),
    });
  },

  ADD_PIPES({ pipes }) {
    const gap = 200 + 100 * Math.random();
    const top = 100 + (SCREEN_HEIGHT - 500) * Math.random();
    return pipes.merge({
      pipes: pipes.pipes.concat([
        { ...defaultPipe, y: top, bottom: false },
        { ...defaultPipe, y: top + gap, bottom: true },
      ]),
    });
  },

  DEFAULT({ pipes }) {
    return pipes;
  },
});

let maxNumPipes = 10;
const Pipes = connect(
  ({ pipes: { pipes } }) => (Immutable({ pipes }))
)(
  ({ pipes }) => {
    // Ensure a constant-ish number of components by rendering extra
    // off-screen pipes
    let key = 0;
    maxNumPipes = Math.max(maxNumPipes, pipes.length);
    return (
      <View style={styles.container}>
        {
          [
            ...pipes,
            ...Array(maxNumPipes - pipes.length).fill(defaultPipe),
          ].map((pipe) => (
            <Image key={key++}
              style={{ position: 'absolute',
                       left: pipe.x,
                       top: pipe.bottom ? pipe.y : pipe.y - pipe.h,
                       width: pipe.w,
                       height: pipe.h,
                       backgroundColor: 'transparent' }}
              source={{ uri: 'http://i.imgur.com/rXhKHaH.png' }}
            />
          ))
        }
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

const Score = connect(
  ({ splash, score }) => ({ splash, score: Math.floor(score) })
)(
  ({ splash, score }) => (
    <Text style={styles.score}>
      {splash ? '' : score}
    </Text>
  )
);


/**
 * Splash
 */

const Splash = connect(
  ({ splash }) => ({ splash })
)(
  ({ splash }) => {
    if (!splash) {
      return <View>{null}</View>;
    }

    let w = 398, h = 202;
    return (
      <Image style={{ position: 'absolute',
                      left: (SCREEN_WIDTH - w) / 2,
                      top: 100,
                      width: w,
                      height: h,
                      backgroundColor: 'transparent' }}
        source={{ uri: 'http://i.imgur.com/kgJfxjH.png' }}/>
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
        splash: false,
        reverse: action.pressed && !state.bird.alive,
      });
      break;
  }

  return newState.merge({
    bird: birdReduce(state, action, dispatch),
    pipes: pipesReduce(state, action, dispatch),
    score: scoreReduce(state, action, dispatch),
  });
};

const Scene = () => (
  <View style={[styles.container, { backgroundColor: '#F5FCFF' }]}>
    <Pipes />
    <Bird />
    <Score />
    <Splash />
  </View>
);


let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  score: {
    position: 'absolute',
    left: 20,
    top: 20,
    color: '#ff0000',
    fontSize: 24,
    backgroundColor: 'transparent',
  },
});

export default {
  sceneReduce,
  Scene,
};

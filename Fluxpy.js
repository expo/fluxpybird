'use strict';

import React from 'react-native';
const {
  Image,
  StyleSheet,
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
      x: SCREEN_WIDTH - 280,
      y: SCREEN_HEIGHT / 2,
      w: 41, h: 29,
      vy: 0, vx: 110,
      ay: 700,
    });
  },

  TICK({ bird, pipes: { pipes } }, { dt }, dispatch) {
    if (bird.y < 0 || bird.y + bird.h > SCREEN_HEIGHT) {
      dispatch({ type: 'START' });
    } else if (
      pipes.some(pipe => {
        if (pipe.x + pipe.w > bird.x - bird.w / 2 &&
          pipe.x < bird.x + bird.w / 2) {
            return pipe.bottom ?
                   bird.y + bird.h / 2 > pipe.y :
                   bird.y - bird.h / 2 < pipe.y;
        }})
    ) {
      dispatch({ type: 'START' });
    }

    return bird.merge({
      y: bird.y + bird.vy * dt,
      vy: bird.vy + bird.ay * dt,
      vx: bird.vx + 9 * dt,
    });
  },

  TOUCH({ bird }, { pressed }) {
    return bird.merge({
      ay: pressed ? -1600 : 700,
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

  TICK({ bird, pipes }, { dt }, dispatch) {
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
 * Fluxpy
 */

const sceneReduce = (state = Immutable({}), action, dispatch) => {
  // Time travel hacks
  if (action.type === 'TICK' && state.reverse) {
    if (!state.parent) {
      return state;
    }
    return state.parent.merge({ reverse: true });
  }
  state = state.merge({ parent: state });
  if (action.type === 'TOUCH' && action.y0 && action.y0 < 200) {
    state = state.merge({ reverse: action.pressed });
  }

  if (action.type === 'START') {
    state = Immutable({});
  }
  return state.merge({
    bird: birdReduce(state, action, dispatch),
    pipes: pipesReduce(state, action, dispatch),
  });
};

const Scene = () => (
  <View style={[styles.container, { backgroundColor: '#F5FCFF' }]}>
    <Pipes />
    <Bird />
  </View>
);


let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default {
  sceneReduce,
  Scene,
};

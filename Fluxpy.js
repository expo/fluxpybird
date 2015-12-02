'use strict';

import React from 'react-native';
const {
  Image,
  StyleSheet,
  View,
} = React;

import { connect } from 'react-redux/native';
import Dimensions from 'Dimensions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;


/**
 * Bird
 *
 * Bird's (x, y) is position of its center
 */

const birdReduce = (state, action, dispatch) => {
  switch (action.type) {
    case 'START':
      return {
        x: SCREEN_WIDTH - 280,
        y: SCREEN_HEIGHT / 2,
        w: 41, h: 29,
        vy: 0, vx: 110,
        ay: 700,
      };

    case 'TICK':
      return {
        ...state.bird,
        y: state.bird.y + state.bird.vy * action.dt,
        vy: state.bird.vy + state.bird.ay * action.dt,
        vx: state.bird.vx + 9 * action.dt,
      };

    case 'TOUCH':
      return {
        ...state.bird,
        ay: action.pressed ? -1600 : 700,
      };

    default:
      return state.bird;
  }
};

const Bird = connect(
  ({ bird }) => ({ bird })
)(
  ({ bird }) => {
    const rot = Math.max(-25, Math.min(bird.vy / (bird.vy > 0 ? 9 : 6), 50));
    return (
      <Image style={{ position: 'absolute',
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

const pipesReduce = (state, action, dispatch) => {
  switch (action.type) {
    case 'START':
      return {
        distance: 120,
        pipes: [],
      };

    case 'TICK':
      if (state.pipes.distance < 0) {
        dispatch({ type: 'ADD_PIPES' });
      }
      return {
        ...state.pipes,
        distance: (state.pipes.distance < 0 ?
                   240 * Math.random() + 70 :
                   state.pipes.distance - state.bird.vx * action.dt),
        pipes: state.pipes.pipes.map((pipe) => ({
          ...pipe,
          x: pipe.x - state.bird.vx * action.dt,
        })).filter((pipe) => pipe.x + pipe.w > 0),
      };

    case 'ADD_PIPES':
      const gap = 200 + 100 * Math.random();
      const top = 100 + (SCREEN_HEIGHT - 500) * Math.random();
      return {
        ...state.pipes,
        pipes: [
          ...state.pipes.pipes,
          { ...defaultPipe, y: top, bottom: false },
          { ...defaultPipe, y: top + gap, bottom: true },
        ],
      };

    default:
      return state.pipes;
  }
};

let maxNumPipes = 10;
const Pipes = connect(
  ({ pipes: { pipes } }) => ({ pipes })
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

const sceneReduce = (state, action, dispatch) => {
  return {
    bird: birdReduce(state, action, dispatch),
    pipes: pipesReduce(state, action, dispatch),
  };
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

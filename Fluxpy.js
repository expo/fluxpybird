'use strict';

import React from 'react-native';
const {
  Image,
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

const birdReduce = (state, action) => {
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
 * Fluxpy
 */

const sceneReduce = (state, action, dispatch) => {
  return {
    bird: birdReduce(state, action, dispatch),
    pipes: pipesReduce(state, action, dispatch),
  };
};

const Scene = () => (
  <Bird />
);

export default {
  sceneReduce,
  Scene,
};

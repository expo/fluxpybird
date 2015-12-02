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
      };

    default:
      return state.bird;
  }
};

const Bird = connect(
  ({ bird }) => ({ bird })
)(
  ({ bird }) => {
    let rot = Math.max(-25, Math.min(bird.vy / (bird.vy > 0 ? 9 : 6), 50));
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

const reduce = (state, action) => {
  return {
    bird: birdReduce(state, action),
  };
};

const Scene = connect()(
  () => (
    <Bird />
  )
);

export default {
  reduce,
  Scene,
};

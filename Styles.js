'use strict';

import Dimensions from 'Dimensions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default {
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0, left: 0,
    width: SCREEN_WIDTH, height: SCREEN_HEIGHT,
  },
  screenW: SCREEN_WIDTH,
  screenH: SCREEN_HEIGHT,
};

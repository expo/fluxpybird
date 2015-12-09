// Import from a different module for a different game!
const Dimensions = require('Dimensions');
const { createStore } = require('redux');
import instrumentCreateStore from './instrumentCreateStore';
const Immutable = require('seamless-immutable');

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

let _guid = 0;
function getGUID() {
  _guid++;
  return `__${_guid}`
}

const cloudReduce = defaultReducer({
  START() {
    return Immutable({
      clouds: cloudImgs.map((img) => ({
        x: SCREEN_WIDTH * 3 * Math.random(),
        y: SCREEN_HEIGHT * Math.random() - CLOUD_HEIGHT / 2,
        vxFactor: 0.1 + 0.2 * Math.random(),
        img,
        guid: getGUID(),
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
          x: SCREEN_WIDTH * (1 + Math.random()),
          y: SCREEN_HEIGHT * Math.random() - CLOUD_HEIGHT / 2,
          vxFactor: 0.2 + 0.2 * Math.random(),
        });
      }),
    });
  },

  DEFAULT({ clouds }) {
    return clouds;
  },
});

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
      x: SCREEN_WIDTH - 280,
      y: SCREEN_HEIGHT / 2,
      w: 41, h: 29,
      vx: 110, vy: 0,
      ay: 700, ax: 9,
    });
  },

  TICK({ splash, bird, pipes: { pipes } }, { dt }, dispatch) {
    let die = false;
    if (bird.alive) {
      if (bird.y < 0 || bird.y + bird.h > SCREEN_HEIGHT) {
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
      if (bird.y > SCREEN_HEIGHT + 400) {
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


/**
 * Pipes
 *
 * A pipe's (x, y) is where the left corner of its 'surface' is (bottom edge for
 * top-pipe, top edge for bottom-pipe)
 */

const defaultPipe = {
  x: SCREEN_WIDTH + 2, y: -2,
  w: 58, h: 800,
  bottom: false,
};

const pipeImgs = [
  'pillar-1.png',
  'pillar-2.png',
];

const pickPipeImg = () => (
  pipeImgs[Math.floor(pipeImgs.length * Math.random())]
);

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
    } else if (pipes.cursor > SCREEN_HEIGHT - 340) {
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
        { ...defaultPipe, y: top, bottom: false, img: pickPipeImg(), guid: getGUID() },
        { ...defaultPipe, y: top + gap, bottom: true, img: pickPipeImg(), guid: getGUID()  },
      ]),
    });
  },

  DEFAULT({ pipes }) {
    return pipes;
  },
});

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



const REPL = require('./REPL');

const dispatchQueue = [];

const queueDispatch = (action) => dispatchQueue.push(action);

const mainReduce = (state, action) => {
  if (action.type === 'TICK') {
    REPL.flushEvalInQueue();
  }

  const actions = [action].concat(dispatchQueue);
  dispatchQueue.length = 0;
  const dispatch = (action) => actions.push(action);
  while (actions.length > 0) {
    state = sceneReduce(state, actions.shift(), dispatch);
  }
  return state;
};

// let store = instrumentCreateStore(createStore)(mainReduce,
//   mainReduce(undefined, { type: 'START' }));
let store = createStore(mainReduce,
  mainReduce(undefined, { type: 'START' }));

module.exports = {
  store,
}

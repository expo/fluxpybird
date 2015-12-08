/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule instrumentCreateStore
 */
'use strict';

import React from 'react-native';

let currentActionType;
let measurements = {};

function trackReducer(reducer) {
  return (state, action) => {
    let startTime = new Date();

    /* Do the work */
    let result = reducer(state, action);

    let duration = (new Date()) - startTime;

    if (action && action.type) {
      measurements[action.type] = {
        ...measurements[action.type],
        reducerTime: duration,
      };
    }

    return result;
  };
}

function extractListenerData(displayName, state) {
  return {
    component: displayName,
    state,
  };
}

function trackListener(listener) {
  return function() {
    let startTime = new Date();
    let result;

    /* Do the work */
    result = listener(extractListenerData);

    if (!result) {
      return;
    }

    let { component } = result;
    let duration = (new Date()) - startTime;
    let currentMeasurements = measurements[currentActionType];

    /* Alternate data format that gives us more insight */
    // let { component, state } = result;
    // let data = { component, duration, state }

    let data = `${component}: ${duration}ms`;
    measurements[currentActionType].listeners.push(data);

    measurements[currentActionType] = {
      ...currentMeasurements,
      listenerTime: currentMeasurements.listenerTime + duration,
    };
  };
}

let perfTrackingStarted = false;

function trackDispatch(action, dispatch) {
  /* It is possible for an action to be dispatched by another action, so
   * here we track the parent to surface that. Could also easily support
   * tracking multiple parents.. But probably don't want to encourage that.. */
  let parentActionType = currentActionType;
  currentActionType = action.type;

  /* Initialize some clean data for this action */
  measurements[currentActionType] = {
    type: currentActionType,
    parentType: parentActionType,
    listeners: [],
    listenerTime: 0,
    reducerTime: 0,
  };

  /* Actually do the action */
  let result = dispatch();

  /* Log the results */
  console.log(measurements[currentActionType]);

  /* Clean up */
  currentActionType = parentActionType;
  return result;
}

function hook(wrapReducer, wrapListener, wrapDispatch) {
  return (next) => (reducer, initialState) => {
    const store = next(wrapReducer(reducer), initialState);

    return {
      ...store,
      dispatch: (action) => {
        return wrapDispatch(action, () => { store.dispatch(action); });
      },
      subscribe: (listener) => {
        return store.subscribe(wrapListener(listener));
      },
    };
  };
}

export default function instrumentCreateStore(createStoreFn) {
  return hook(trackReducer, trackListener, trackDispatch)(createStoreFn);
}

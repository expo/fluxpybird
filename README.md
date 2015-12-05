<p align="center">
  <img src="http://g.recordit.co/8YFrjN05lG.gif" alt=Fun!"/>
</p>

This is a game written with [exponent](http://exponentjs.com/), [react-native](https://facebook.github.io/react-native/) and [redux](https://github.com/rackt/redux).

Here are a few quick notes. I'll write a longer blog post soon explaining in more detail!

1. Redux actions are used for all game events. For example, the `{ type: 'TOUCH', pressed: <whether pressed> }` event, when dispatched, causes the game's reducers to respond to a touch press. You see in the above GIF image a `queueDispatch(...)` call which queues an action for dispatch on next `'TICK'` (which is itself an action `{ type: TICK, dt: <time since last frame }` which advances game time by `dt`). [`'Touch'`](https://github.com/exponentjs/fluxpybird/blob/e50dd2191b77f0b8b3bbceb6a61498581ae1e668/main.js#L33) dispatches the `'TOUCH'` actions, [`Clock`](https://github.com/exponentjs/fluxpybird/blob/e50dd2191b77f0b8b3bbceb6a61498581ae1e668/main.js#L68) the `'TICK'` ones.
2. There is a babelified remote-REPL interface. Works on simulator as shown in the GIF image above, works on device too. The REPL has access into the context of a module, and can modify private variables or update functions in there. So, hot-reloading (gotta clean up some details)! It shouldn't be too hard to make an emacs or atom interface that's similar to SLIME for Lisp. Since it uses babel and also seems to catch the project-specific `.babelrc`, you can use fun ES6 things.
3. The game has time travel. Redux makes this easy. After you lose, if the plane is still on screen, a touch makes the game start going backwards in time (a quick peek of that in the GIF image above). Sort of like Braid.
4. I tried to be super modern and used stateless function components and nice destructuring etc. everywhere.
5. You can queue dispatches from within reducers. Reducers get their usual `state, actions` parameter but also a `dispatch` parameter which queues actions to be performed after the current action is fully reduced. Used [here](https://github.com/exponentjs/fluxpybird/blob/e50dd2191b77f0b8b3bbceb6a61498581ae1e668/Fluxpy.js#L154) for example to queue an `ADD_PIPES` action (handler visible a few lines of code below) when the distance to the next pair of pipes is `< 0`.

## Art Sources

- Plane: http://www.spriters-resource.com/arcade/ms/
- Clouds: http://rebloggy.com/post/cute-sky-clouds-storm-pixel-art-pixel-pixels-tranparent/88710091972
- Pillars: http://www.nintendolife.com/forums/general_discussion/pixelartany_art?start=2300

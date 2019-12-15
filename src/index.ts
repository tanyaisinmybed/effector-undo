import {
  createStore,
  createEvent,
  guard,
  forward,
  sample,
  merge,
  Store,
  Event
} from "effector";

export type Filter<State> = (state: State, prevState: State) => boolean

export interface HistoryOptions<State = any> {
  store: Store<State>;
  events: Event<any>[];
  limit?: number;
  filter?: Filter<State>;
  debug?: boolean;
}

export function createHistory<State>({
  store,
  events,
  limit = 10,
  filter = defaultFilter,
  debug
}: HistoryOptions<State>) {
  const initialState = store.getState();
  const name = store.shortName;

  const clear = createEvent(name + "-history-clear");
  const push = createEvent<State>(name + "-history-push");
  const undo = createEvent(name + "-history-undo");
  const redo = createEvent(name + "-history-redo");

  const history = createStore({
    states: [store.getState()],
    head: 0
  })
    .on(push, ({ states, head }, state) => ({
      states: [state].concat(states.slice(head)).slice(0, limit),
      head: 0
    }))
    .on(undo, ({ states, head }) => ({
      states,
      head: Math.min(head + 1, states.length - 1)
    }))
    .on(redo, ({ states, head }) => ({
      states,
      head: Math.max(head - 1, 0)
    }))
    .reset(clear);

  const current = history.map(({ states, head }) => states[head]);

  const shouldSave = createStore({
    next: initialState,
    prev: initialState
  })
    .on(store, ({ next: prev }, next) => ({ next, prev }))
    .map(({ next, prev }) => filter(next, prev));

  guard({
    source: sample<State>(store, merge(events)),
    filter: shouldSave,
    target: push
  });

  forward({
    from: current,
    to: store
  });

  if (debug) {
    history.watch(state => {
      console.group("effector-undo: ", name);
      console.log("History: ", state.states);
      console.log("Head: ", state.head);
      console.groupEnd();
    });
  }

  return { undo, redo, clear, history };
}

const defaultFilter: Filter<any> = () => true;

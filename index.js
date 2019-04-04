import {createStore, createApi} from "effector";

export function createHistory(store, {
    limit = 10,
    ignoreInitialState,
    events,
    filter,
    debug
} = {}) {
    const initialState = store.getState();

    const history = createStore({
        states: ignoreInitialState ? [] : [initialState],
        head: 0
    });

    const currentState = history.map(({states, head}) => states[head]);

    const {push, undo, redo, clear} = createApi(history, {
        push: ({ states, head }, state) => ({
            states: [state].concat(states.slice(head)).slice(0, limit),
            head: 0
        }),
        undo: ({ states, head }) => ({
            states,
            head: Math.min(head + 1, states.length - 1)
        }),
        redo: ({ states, head }) => ({
            states,
            head: Math.max(head - 1, 0)
        }),
        clear: ({states, head}) => ({
            states: states.length > 0 ? [states[head]] : [],
            head: 0
        })
    });

    const {set} = createApi(store, {
        set: (_, state) => state
    });

    let lastState = initialState;
    events.forEach(event => {
        store.watch(event, (state) => {
            if (filter && !filter(lastState, state)) return;

            push(state);
            lastState = state;
        })
    });

    currentState.watch(undo, set);
    currentState.watch(redo, set);

    if (process.env.NODE_ENV === "development" && debug) {
        history.watch(state => {
            console.group("effector-undo");
            console.log("History: ", state.states);
            console.log("Head: ", state.head);
            console.groupEnd();
        })
    }

    return {undo, redo, clear};
}
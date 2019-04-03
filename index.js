import {createStore, createApi} from "effector";

export function createHistory({ limit = 10, events } = {}) {
    return function (store) {

        const history = createStore({
            states: [store.getState()],
            head: 0
        });

        const currentState = history.map(({states, head}) => states[head]);

        const {push, undo, redo} = createApi(history, {
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
            })
        });

        const { set } = createApi(store, {
            set: (_, state) => state
        });

        events.forEach(event => {
            store.watch(event, push)
        });

        currentState.watch(undo, set);
        currentState.watch(redo, set);

        return {undo, redo};
    }
}
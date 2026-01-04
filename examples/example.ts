import { Dispatch } from "../src";

const dispatch = new Dispatch({
  initialState: {
    count: 1,
  },
  events: {
    increment: (state: { count: number }) => ({ count: state.count + 1 }),
    decrement: (state: { count: number }) => ({ count: state.count - 1 }),
  },
  validNextEvents: {
    increment: ["increment", "decrement"],
    decrement: ["decrement"],
  },
});

// Subscribe to state changes
dispatch.subscribe((state) => {
  console.log("State updated:", state);
});

// Usage - send events using the send() method
console.log("Initial state:", dispatch.getState()); // { count: 1 }

dispatch.dispatch("increment"); // count = 2
console.log("After increment:", dispatch.getState());

dispatch.dispatch("increment"); // count = 3
console.log("After increment:", dispatch.getState());

dispatch.dispatch("decrement"); // count = 2
console.log("After decrement:", dispatch.getState());

dispatch.dispatch("decrement"); // count = 1
console.log("After decrement:", dispatch.getState());

// This will throw an error: "Cannot transition from 'decrement' to 'increment'"
try {
  dispatch.dispatch("increment");
} catch (error) {
  console.error("Error:", (error as Error).message);
}

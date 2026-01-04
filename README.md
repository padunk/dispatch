# Dispatch - Lite XState Alternative

A lightweight TypeScript state machine library inspired by XState. Provides predictable state management with event-driven transitions and validation.

## Features

- ✅ **Type-safe**: Full TypeScript support with generic types
- ✅ **Event validation**: Ensures only valid state transitions occur
- ✅ **State tracking**: Track current event and available next events
- ✅ **Subscriptions**: Subscribe to state changes
- ✅ **Immutable updates**: State is never mutated directly
- ✅ **Simple API**: Easy to learn and use

## How It Works

The key insight is that **you don't call event functions directly**. Instead:

1. **Define events as state updater functions** - They receive current state and return partial updates
2. **Use the `send()` method** - This allows the library to intercept, validate, and track the event
3. **Track the current event** - The library remembers which event was last triggered
4. **Validate transitions** - Check if the next event is allowed based on `validNextEvents`

### Why `send()` Instead of Direct Function Calls?

```typescript
// ❌ BAD: Direct function calls - no way to intercept or validate
const { increment } = dispatch.getEvents();
increment(state); // Can't track this!

// ✅ GOOD: send() method - library can intercept, validate, and track
dispatch.send("increment"); // Fully controlled by the library
```

## Installation

```bash
npm install dispatch
```

## Basic Usage

```typescript
import Dispatch from "./vanilla";

const counter = new Dispatch({
  initialState: {
    count: 0,
  },
  events: {
    // Events return partial state updates
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
  },
  validNextEvents: {
    // Define which events can follow each event
    increment: ["increment", "decrement"],
    decrement: ["decrement", "increment"],
  },
});

// Subscribe to state changes
counter.subscribe((state) => {
  console.log("Count:", state.count);
});

// Send events using the send() method
counter.send("increment"); // count = 1
counter.send("increment"); // count = 2
counter.send("decrement"); // count = 1
```

## API Reference

### Constructor

```typescript
new Dispatch<State>({
  initialState: State,
  events: Record<string, (state: State) => Partial<State>>,
  validNextEvents: Record<string, string[]>,
});
```

### Methods

#### `send(eventName: string): void`

Dispatch an event to trigger a state transition.

- Validates the event exists
- Checks if the transition is allowed
- Updates the state
- Notifies all subscribers

```typescript
dispatch.send("increment");
```

#### `subscribe(listener: (state: State) => void): () => void`

Subscribe to state changes. Returns an unsubscribe function.

```typescript
const unsubscribe = dispatch.subscribe((state) => {
  console.log(state);
});

// Later...
unsubscribe();
```

#### `getState(): State`

Get the current state (returns a copy).

```typescript
const state = dispatch.getState();
console.log(state.count);
```

#### `getCurrentEvent(): string | null`

Get the name of the last event that was dispatched.

```typescript
dispatch.send("increment");
console.log(dispatch.getCurrentEvent()); // "increment"
```

#### `getValidNextEvents(): string[]`

Get the list of valid events that can be dispatched next.

```typescript
dispatch.send("increment");
console.log(dispatch.getValidNextEvents()); // ["increment", "decrement"]
```

#### `resetState(): void`

Reset the state back to the initial state and clear the current event.

```typescript
dispatch.resetState();
```

## Advanced Examples

### Authentication Flow

```typescript
type AuthState = {
  status: "idle" | "loading" | "authenticated" | "error";
  user: string | null;
  error: string | null;
};

const authMachine = new Dispatch<AuthState>({
  initialState: {
    status: "idle",
    user: null,
    error: null,
  },
  events: {
    login: (state) => ({ status: "loading", error: null }),
    loginSuccess: (state) => ({
      status: "authenticated",
      user: "john@example.com",
    }),
    loginError: (state) => ({
      status: "error",
      error: "Invalid credentials",
    }),
    logout: (state) => ({
      status: "idle",
      user: null,
      error: null,
    }),
  },
  validNextEvents: {
    login: ["loginSuccess", "loginError"],
    loginSuccess: ["logout"],
    loginError: ["login"],
    logout: ["login"],
  },
});

authMachine.send("login");
authMachine.send("loginSuccess");
console.log(authMachine.getValidNextEvents()); // ["logout"]
```

### Traffic Light

```typescript
const trafficLight = new Dispatch({
  initialState: {
    color: "red",
    timer: 30,
  },
  events: {
    toGreen: (state) => ({ color: "green", timer: 30 }),
    toYellow: (state) => ({ color: "yellow", timer: 5 }),
    toRed: (state) => ({ color: "red", timer: 30 }),
  },
  validNextEvents: {
    toRed: ["toGreen"],
    toGreen: ["toYellow"],
    toYellow: ["toRed"],
  },
});

trafficLight.send("toGreen");
trafficLight.send("toYellow");
trafficLight.send("toRed");
```

## Error Handling

The library throws errors for invalid operations:

```typescript
// Invalid event name
try {
  dispatch.send("invalidEvent");
} catch (error) {
  console.error(error.message);
  // "Event "invalidEvent" does not exist"
}

// Invalid transition
try {
  dispatch.send("increment");
  dispatch.send("reset"); // Not in validNextEvents
} catch (error) {
  console.error(error.message);
  // "Cannot transition from "increment" to "reset". Valid next events: increment, decrement"
}
```

## Comparison with XState

| Feature             | Dispatch   | XState        |
| ------------------- | ---------- | ------------- |
| Size                | ~100 lines | Large (~50KB) |
| Learning Curve      | Simple     | Steeper       |
| State Machines      | ✅         | ✅            |
| Hierarchical States | ❌         | ✅            |
| Parallel States     | ❌         | ✅            |
| State Charts        | ❌         | ✅            |
| Actors              | ❌         | ✅            |
| TypeScript          | ✅         | ✅            |

Use **Dispatch** for simple state machines. Use **XState** for complex state charts with hierarchical/parallel states.

## License

MIT

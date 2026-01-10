# Dispatch - Type-Safe State Machines

A lightweight, **type-safe** state machine library for TypeScript. Get autocomplete for events, runtime validation, and optional schema validation.

## ✨ Features

- 🔒 **Fully Type-Safe**: Event names, state, and payloads are all type-checked
- 🎯 **IDE Autocomplete**: Your editor suggests valid event names
- ✅ **Runtime Validation**: Catches invalid transitions and event references
- 🔄 **Immutable Updates**: Powered by Immer for clean state updates
- 🪝 **Simple API**: Easy to learn, powerful to use
- 🎨 **Flexible Patterns**: Support for both return-style and draft-style updates

## 📦 Installation

```bash
npm install dispatch
# or
bun add dispatch
```

## 🚀 Quick Start

```typescript
import { createDispatch } from 'dispatch'

const counter = createDispatch({
  initialState: { count: 0 },
  events: {
    increment: (state: { count: number }) => ({ count: state.count + 1 }),
    decrement: (state: { count: number }) => ({ count: state.count - 1 }),
    reset: () => ({ count: 0 }),
  },
  validNextEvents: {
    increment: ['increment', 'decrement', 'reset'],
    decrement: ['increment', 'decrement', 'reset'],
    reset: ['increment'],
  },
})

// Subscribe to state changes
counter.subscribe((state) => {
  console.log('Count:', state.count)
})

// Dispatch events
counter.dispatch('increment') // ✅ count = 1
counter.dispatch('increment') // ✅ count = 2
counter.dispatch('decrement') // ✅ count = 1
```

## 📚 API Reference

### `createDispatch(config)`

Create a type-safe state machine.

```typescript
const machine = createDispatch({
  initialState: Data,
  events: {
    [eventName]: (state: Data, payload?: any) => Partial<Data> | void
  },
  validNextEvents: {
    [eventName]: string[]
  },
  schema?: z.ZodSchema<Data> // Optional Zod schema
});
```

### `dispatch(eventName, payload?)`

Trigger a state transition.

```typescript
machine.dispatch('increment')
machine.dispatch('setValue', { value: 42 })
```

### `subscribe(listener)`

Listen to state changes. Returns unsubscribe function.

```typescript
const unsubscribe = machine.subscribe((state) => {
  console.log(state)
})

unsubscribe() // Stop listening
```

#### `getState(): State`

Get the current state (returns a copy).

```typescript
const state = dispatch.getState()
console.log(state.count)
```

#### `getCurrentEvent(): string | null`

Get the name of the last event that was dispatched.

```typescript
dispatch.send('increment')
console.log(dispatch.getCurrentEvent()) // "increment"
```

#### `getValidNextEvents(): string[]`

Get the list of valid events that can be dispatched next.

```typescript
dispatch.send('increment')
console.log(dispatch.getValidNextEvents()) // ["increment", "decrement"]
```

#### `resetState(): void`

Reset the state back to the initial state and clear the current event.

```typescript
dispatch.resetState()
```

## 🛡️ Zod Schema Validation

Validate your state shape at runtime:

```typescript
import { z } from 'zod'
import { createValidatedDispatch } from 'dispatch'

const UserSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(0).max(150),
  email: z.string().email(),
})

type User = z.infer<typeof UserSchema>

const user = createValidatedDispatch({
  schema: UserSchema,
  initialState: {
    name: 'John',
    age: 30,
    email: 'john@example.com',
  } as User,
  events: {
    updateName: (state: User, name: string) => ({ name }),
    updateAge: (state: User, age: number) => ({ age }),
  },
  validNextEvents: {
    updateName: ['updateAge'],
    updateAge: ['updateName'],
  },
})
```

### Draft-Style Updates (Immer)

Mutate drafts directly for complex updates:

```typescript
const todos = createDispatch({
  initialState: {
    items: [] as Array<{ id: number; text: string; done: boolean }>,
  },
  events: {
    addTodo: (draft, text: string) => {
      draft.items.push({ id: Date.now(), text, done: false })
    },
    toggleTodo: (draft, id: number) => {
      const todo = draft.items.find((t) => t.id === id)
      if (todo) todo.done = !todo.done
    },
  },
  validNextEvents: {
    addTodo: ['addTodo', 'toggleTodo'],
    toggleTodo: ['addTodo', 'toggleTodo'],
  },
})
```

## 💡 Patterns

### React Integration

Dispatch integrates seamlessly with React:

```typescript
import { createDispatch, useDispatch, useSelector, useMachine } from "dispatch";

const counter = createDispatch({
  initialState: { count: 0 },
  events: {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
  },
  validNextEvents: {
    increment: ["increment", "decrement"],
    decrement: ["increment", "decrement"],
  },
});

// Option 1: Subscribe to full state
function Counter() {
  const state = useDispatch(counter);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => counter.dispatch("increment")}>+</button>
      <button onClick={() => counter.dispatch("decrement")}>-</button>
    </div>
  );
}

// Option 2: Select derived values
function DoubleCounter() {
  const double = useSelector(counter, (state) => state.count * 2);
  return <p>Double: {double}</p>;
}

// Option 3: Full machine API
function FullCounter() {
  const [state, dispatch, machine] = useMachine(counter);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch("increment")}>+</button>
      <p>Valid: {machine.getValidNextEvents().join(", ")}</p>
    </div>
  );
}
```

#### React Hooks API

- **`useDispatch(machine)`** - Subscribe to full state
- **`useSelector(machine, selector)`** - Subscribe to derived value
- **`useCurrentEvent(machine)`** - Get current event name
- **`useValidNextEvents(machine)`** - Get valid next events
- **`useMachine(machine)`** - Returns `[state, dispatch, machine]` tuple

## ⚠️ Error Handling

### Invalid Event

```typescript
try {
  machine.dispatch('nonexistent')
} catch (error) {
  // ❌ Error: Event "nonexistent" does not exist
}
```

## 🎯 Type Safety in Action

### Event Name Autocomplete

Event names are fully type-safe with IDE autocomplete:

```typescript
counter.dispatch('increment') // ✅ Autocomplete suggests: "increment" | "decrement" | "reset"
counter.dispatch('invalid') // ❌ TypeScript error: Argument of type '"invalid"' is not assignable
```

### Validation in `validNextEvents`

```typescript
validNextEvents: {
  increment: ["dec"], // ❌ TypeScript error!
  //          ^^^^^
  // Type '"dec"' is not assignable to type '"increment" | "decrement" | "reset"'
}
```

### Runtime Safety

```typescript
try {
  counter.dispatch('invalidEvent') // ❌ Runtime error
} catch (error) {
  // Error: Event "invalidEvent" does not exist
}
```

## 🆚 Why Not XState?

| Feature             | Dispatch    | XState     |
| ------------------- | ----------- | ---------- |
| **Learning Curve**  | Simple      | Steeper    |
| **Type Safety**     | ✅ Built-in | ⚠️ Complex |
| **Object Schema**   | ✅          | ❌         |
| **State Machines**  | ✅          | ✅         |
| **Hierarchical**    | ❌          | ✅         |
| **Parallel States** | ❌          | ✅         |
| **Actors**          | ❌          | ✅         |

**Choose Dispatch** for simple, type-safe state machines with simple DX.  
**Choose XState** for complex hierarchical/parallel state charts.

## 📖 Learn More

- [Examples](./examples/) - Real-world usage examples

## License

MIT

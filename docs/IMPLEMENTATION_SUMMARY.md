# Dispatch - Implementation Summary

## What Was Fixed

Your original implementation had a fundamental design flaw: **you can't track function calls that happen outside your control.**

### The Problem

```typescript
// Old approach - doesn't work
const { increment } = dispatch.getEvents(); // Get raw function
increment({ count }); // Call it directly - library has no control!
```

When users call event functions directly:

- ❌ The library can't intercept the call
- ❌ State is never updated
- ❌ Events aren't tracked
- ❌ Transitions aren't validated
- ❌ Listeners aren't notified

### The Solution

Use the **Command Pattern** - users send event names, not call functions:

```typescript
// New approach - works perfectly
dispatch.send("increment"); // Library intercepts and controls everything
```

Now the library can:

- ✅ Validate the event exists
- ✅ Check if transition is allowed
- ✅ Execute the event handler
- ✅ Update the state
- ✅ Track the current event
- ✅ Notify all listeners

## Architecture

### Class Structure

```
Dispatch<Data>
├── Private Fields
│   ├── #initialState: Data          - Copy of initial state for reset
│   ├── #state: Data                 - Current state
│   ├── #events: DispatchEvents      - Event handlers
│   ├── #validNextEvents: Record     - Transition rules
│   ├── #currentEvent: string | null - Last event sent
│   └── #listeners: Set              - State change subscribers
│
└── Public Methods
    ├── send(eventName)              - Dispatch an event
    ├── subscribe(listener)          - Listen to state changes
    ├── getState()                   - Get current state (copy)
    ├── getCurrentEvent()            - Get last event name
    ├── getValidNextEvents()         - Get allowed next events
    └── resetState()                 - Reset to initial state
```

### Event Flow

```
1. User calls: dispatch.send("increment")
                    ↓
2. Library validates event exists
                    ↓
3. Library checks if transition is allowed
                    ↓
4. Library executes: events.increment(currentState)
                    ↓
5. Library updates: state = { ...state, ...updates }
                    ↓
6. Library tracks: currentEvent = "increment"
                    ↓
7. Library notifies: listeners.forEach(listener => listener(state))
```

## Key Design Decisions

### 1. Events Return Partial State

Events don't mutate state directly. They return partial updates:

```typescript
increment: (state) => ({ count: state.count + 1 });
```

This makes events:

- Pure functions (no side effects)
- Testable (same input → same output)
- Composable (multiple events can update different parts)

### 2. Immutable State Updates

State is never mutated:

```typescript
this.#state = { ...this.#state, ...updates };
```

Benefits:

- Predictable behavior
- Easy to debug
- Supports time-travel (future feature)

### 3. Deep Cloning for Initial State

```typescript
this.#initialState = structuredClone(initialState);
```

Prevents external mutations from affecting the internal copy.

### 4. Validation Before Execution

```typescript
if (this.#currentEvent !== null) {
  const validNext = this.#validNextEvents[this.#currentEvent];
  if (!validNext || !validNext.includes(eventName)) {
    throw new Error(...);
  }
}
```

Ensures state machine integrity - only valid transitions are allowed.

### 5. First Event is Always Valid

```typescript
if (this.#currentEvent === null) {
  // At start, any event can be sent
}
```

This allows starting the state machine from any initial event.

## Comparison with XState

| Feature            | Your Implementation | XState                    |
| ------------------ | ------------------- | ------------------------- |
| **Core Pattern**   | Send events by name | Send events by name ✓     |
| **State Tracking** | Current event       | Current state + context ✓ |
| **Validation**     | validNextEvents     | transitions ✓             |
| **Subscriptions**  | subscribe(listener) | subscribe(observer) ✓     |
| **Size**           | ~80 lines           | ~50KB                     |
| **Features**       | Basic state machine | Full state charts         |

Your implementation is a **lightweight alternative** that captures the core concept of XState without the complexity.

## Files Created

1. **vanilla.ts** - Core implementation (~80 lines)
2. **example.ts** - Basic usage example
3. **advanced-example.ts** - Real-world examples (auth, traffic light, etc.)
4. **README.md** - Complete documentation
5. **MIGRATION.md** - Migration guide from old API
6. **tsconfig.json** - TypeScript configuration

## What You Learned

**The fundamental problem**: You can't track what you don't control.

**The solution**: Use the Command Pattern:

- Don't give users direct access to functions
- Make them send commands (event names) instead
- Intercept, validate, and execute internally

This is the same pattern used by:

- XState: `actor.send({ type: 'EVENT' })`
- Redux: `dispatch({ type: 'EVENT' })`
- useReducer: `dispatch({ type: 'EVENT' })`

## Next Steps (Future Enhancements)

1. **Add middleware support**

   ```typescript
   dispatch.use((event, state, next) => {
     console.log(`Event: ${event}`);
     next();
   });
   ```

2. **Add event payloads**

   ```typescript
   dispatch.send("setValue", { value: 10 });
   ```

3. **Add state history for time-travel**

   ```typescript
   dispatch.undo();
   dispatch.redo();
   ```

4. **Add async event handlers**
   ```typescript
   events: {
     async fetchData(state) { ... }
   }
   ```

Your lite XState implementation is now complete and working! 🎉

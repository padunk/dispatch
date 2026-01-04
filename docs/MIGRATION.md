# Migration Guide: Old API → New API

## Understanding the Problem with the Old Implementation

### The Core Issue: **How do you track a function call?**

When you call a function directly, there's no way for the library to intercept it:

```typescript
// Old implementation
const { increment } = dispatch.getEvents();
increment({ count }); // ❌ Library has no control over this call!
```

The function executes in the caller's context, not within the Dispatch class. The library cannot:

- Track which event was called
- Validate if the transition is allowed
- Update the internal state
- Trigger listeners

### The Solution: **The Command Pattern**

Instead of calling event functions directly, send event **names** to the library:

```typescript
// New implementation
dispatch.send("increment"); // ✅ Library controls everything!
```

Now the library can:

1. Look up the event by name
2. Check if it's a valid transition
3. Execute the event function internally
4. Update the state
5. Track the current event
6. Notify subscribers

## Side-by-Side Comparison

### Old Implementation (Broken)

```typescript
const dispatch = new Dispatch({
  initialState: { count: 1 },
  events: {
    // Returns a value, but who captures it?
    increment: (state) => state.count + 1,
    decrement: ({ count }) => count - 1,
  },
  validNextEvents: {
    increment: ["increment", "decrement"],
    decrement: ["decrement"],
  },
});

// Gets the raw function - library loses control
const { increment } = dispatch.getEvents();

// Calls it directly - no validation, no state update!
increment({ count }); // ❌ Doesn't work
```

**Problems:**

1. ❌ Event functions return values, but nothing captures them
2. ❌ State is never actually updated
3. ❌ No event tracking
4. ❌ No validation against `validNextEvents`
5. ❌ Listeners aren't triggered

### New Implementation (Fixed)

```typescript
const dispatch = new Dispatch({
  initialState: { count: 1 },
  events: {
    // Returns partial state updates
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
  },
  validNextEvents: {
    increment: ["increment", "decrement"],
    decrement: ["decrement"],
  },
});

// Send event by name - library stays in control
dispatch.send("increment"); // ✅ Works perfectly!
dispatch.send("increment"); // ✅ Valid transition
dispatch.send("decrement"); // ✅ Valid transition
dispatch.send("increment"); // ❌ Throws error - invalid transition!
```

**Fixes:**

1. ✅ Events return partial state objects
2. ✅ State is updated internally by the library
3. ✅ Current event is tracked
4. ✅ Transitions are validated
5. ✅ Listeners are notified

## Migration Steps

### Step 1: Update Event Functions

**Before:**

```typescript
events: {
  increment: (state) => state.count + 1, // Returns a number
}
```

**After:**

```typescript
events: {
  increment: (state) => ({ count: state.count + 1 }), // Returns partial state
}
```

### Step 2: Replace Direct Calls with send()

**Before:**

```typescript
const { increment, decrement } = dispatch.getEvents();
increment({ count });
decrement({ count });
```

**After:**

```typescript
dispatch.send("increment");
dispatch.send("decrement");
```

### Step 3: Update State Access

**Before:**

```typescript
const { count } = dispatch.getStates(); // Note: was plural
```

**After:**

```typescript
const { count } = dispatch.getState(); // Note: now singular
```

## Why This Design?

This follows the **Command Pattern** used by:

- **XState**: `actor.send({ type: 'INCREMENT' })`
- **Redux**: `dispatch({ type: 'INCREMENT' })`
- **React useReducer**: `dispatch({ type: 'INCREMENT' })`

The pattern allows the library to maintain control and implement features like:

- State management
- Event validation
- Time-travel debugging (future feature)
- Event logging (future feature)
- Middleware (future feature)

## Key Takeaway

**You can't track a function call that happens outside your control.**

By using `send(eventName)`, you give the library the ability to:

1. Intercept the call
2. Apply business logic (validation)
3. Execute the transition
4. Track the state change
5. Notify observers

This is the fundamental pattern behind all major state management libraries!

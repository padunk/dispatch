import { describe, it, expect, beforeEach } from "vitest";
import Dispatch from "../vanilla";

describe("Dispatch - Return-style updates", () => {
  let counter: Dispatch<{ count: number }>;

  beforeEach(() => {
    counter = new Dispatch<{ count: number }>({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
        add: (state, payload) => ({ count: state.count + payload.value }),
      },
      validNextEvents: {
        increment: ["increment", "add"],
        add: ["increment", "add"],
      },
    });
  });

  it("should increment counter", () => {
    counter.dispatch("increment");
    expect(counter.getState().count).toBe(1);
  });

  it("should add value to counter", () => {
    counter.dispatch("add", { value: 5 });
    expect(counter.getState().count).toBe(5);
  });

  it("should handle multiple operations", () => {
    counter.dispatch("increment");
    counter.dispatch("add", { value: 5 });
    expect(counter.getState().count).toBe(6);
  });
});

describe("Dispatch - Draft-style updates (Immer pattern)", () => {
  type TodoItem = { id: number; text: string };
  let todos: Dispatch<{ items: TodoItem[] }>;

  beforeEach(() => {
    todos = new Dispatch<{ items: TodoItem[] }>({
      initialState: { items: [] as TodoItem[] },
      events: {
        addItem: (draft, payload) => {
          draft.items.push(payload);
        },
        removeItem: (draft, payload) => {
          draft.items = draft.items.filter((item) => item.id !== payload.id);
        },
      },
      validNextEvents: {
        addItem: ["addItem", "removeItem"],
        removeItem: ["addItem", "removeItem"],
      },
    });
  });

  it("should add items", () => {
    todos.dispatch("addItem", { id: 1, text: "Learn XState" });
    todos.dispatch("addItem", { id: 2, text: "Build state machine" });

    expect(todos.getState().items).toHaveLength(2);
    expect(todos.getState().items[0].text).toBe("Learn XState");
    expect(todos.getState().items[1].text).toBe("Build state machine");
  });

  it("should remove items", () => {
    todos.dispatch("addItem", { id: 1, text: "Learn XState" });
    todos.dispatch("addItem", { id: 2, text: "Build state machine" });
    todos.dispatch("removeItem", { id: 1 });

    expect(todos.getState().items).toHaveLength(1);
    expect(todos.getState().items[0].id).toBe(2);
  });
});

describe("Dispatch - Mixed style", () => {
  type UserState = {
    name: string;
    age: number;
    preferences: { theme: string; notifications: boolean };
  };
  let user: Dispatch<UserState>;

  beforeEach(() => {
    user = new Dispatch<UserState>({
      initialState: {
        name: "",
        age: 0,
        preferences: { theme: "light", notifications: true },
      },
      events: {
        // Return-style for simple updates
        setName: (state, payload) => ({ name: payload }),
        setAge: (state, payload) => ({ age: payload }),

        // Draft-style for nested updates
        updatePreferences: (draft, payload) => {
          Object.assign(draft.preferences, payload);
        },
      },
      validNextEvents: {
        setName: ["setName", "setAge", "updatePreferences"],
        setAge: ["setName", "setAge", "updatePreferences"],
        updatePreferences: ["setName", "setAge", "updatePreferences"],
      },
    });
  });

  it("should set name", () => {
    user.dispatch("setName", "Alice");
    expect(user.getState().name).toBe("Alice");
  });

  it("should set age", () => {
    user.dispatch("setAge", 25);
    expect(user.getState().age).toBe(25);
  });

  it("should update preferences while preserving other properties", () => {
    user.dispatch("updatePreferences", { theme: "dark" });
    expect(user.getState().preferences.theme).toBe("dark");
    expect(user.getState().preferences.notifications).toBe(true);
  });

  it("should handle multiple updates", () => {
    user.dispatch("setName", "Alice");
    user.dispatch("setAge", 25);
    user.dispatch("updatePreferences", { theme: "dark" });

    const state = user.getState();
    expect(state.name).toBe("Alice");
    expect(state.age).toBe(25);
    expect(state.preferences.theme).toBe("dark");
  });
});

describe("Dispatch - State management", () => {
  it("should subscribe to state changes", () => {
    const counter = new Dispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    let receivedState: { count: number } | null = null;
    const unsubscribe = counter.subscribe((state) => {
      receivedState = state;
    });

    counter.dispatch("increment");
    expect(receivedState).not.toBeNull();
    expect(receivedState!.count).toBe(1);

    unsubscribe();
  });

  it("should reset state", () => {
    const counter = new Dispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    counter.dispatch("increment");
    counter.dispatch("increment");
    expect(counter.getState().count).toBe(2);

    counter.resetState();
    expect(counter.getState().count).toBe(0);
    expect(counter.getCurrentEvent()).toBeNull();
  });

  it("should track current event", () => {
    const counter = new Dispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    expect(counter.getCurrentEvent()).toBeNull();
    counter.dispatch("increment");
    expect(counter.getCurrentEvent()).toBe("increment");
  });

  it("should return valid next events", () => {
    const counter = new Dispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
        decrement: (state: { count: number }) => ({ count: state.count - 1 }),
      },
      validNextEvents: {
        increment: ["decrement"],
        decrement: ["increment"],
      },
    });

    const initialValid = counter.getValidNextEvents();
    expect(initialValid).toContain("increment");
    expect(initialValid).toContain("decrement");

    counter.dispatch("increment");
    expect(counter.getValidNextEvents()).toEqual(["decrement"]);
  });

  it("should return valid next events - validNextEvents is []", () => {
    const counter = new Dispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
        decrement: (state: { count: number }) => ({ count: state.count - 1 }),
      },
      validNextEvents: {
        increment: [], // all events are valid
        decrement: [], // all events are valid
      },
    });

    const initialValid = counter.getValidNextEvents();
    expect(initialValid).toContain("increment");
    expect(initialValid).toContain("decrement");

    counter.dispatch("increment");
    expect(counter.getValidNextEvents()).toEqual([]);
  });
});

describe("Dispatch - Error handling", () => {
  it("should throw error for non-existent event", () => {
    const counter = new Dispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    // @ts-expect-error - for testing
    expect(() => counter.dispatch("nonexistent")).toThrow(
      'Event "nonexistent" does not exist',
    );
  });

  it("should NOT throw error for valid event", () => {
    const counter = new Dispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
        decrement: (state: { count: number }) => ({ count: state.count - 1 }),
      },
      validNextEvents: {
        increment: [],
        decrement: [],
      },
    });

    // @ts-expect-error - for testing
    expect(() => counter.dispatch("nonexistent")).toThrow(
      'Event "nonexistent" does not exist',
    );

    counter.dispatch("increment");
    counter.dispatch("decrement");

    counter.dispatch("increment");
    counter.dispatch("increment");

    counter.dispatch("decrement");
    counter.dispatch("decrement");

    counter.dispatch("increment");
  });

  it("should throw error for invalid transition", () => {
    const counter = new Dispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
        decrement: (state: { count: number }) => ({ count: state.count - 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
        decrement: ["decrement"],
      },
    });

    counter.dispatch("increment");
    expect(() => counter.dispatch("decrement")).toThrow(
      'Cannot transition from "increment" to "decrement"',
    );
  });
});

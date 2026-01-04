// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createDispatch } from "../vanilla/builder";
import {
  useDispatch,
  useSelector,
  useCurrentEvent,
  useValidNextEvents,
  useMachine,
} from "../react";

describe("React Hooks - useDispatch", () => {
  it("should return current state", () => {
    const counter = createDispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    const { result } = renderHook(() => useDispatch(counter));
    expect(result.current.count).toBe(0);
  });

  it("should update when state changes", () => {
    const counter = createDispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    const { result } = renderHook(() => useDispatch(counter));
    expect(result.current.count).toBe(0);

    act(() => {
      counter.dispatch("increment");
    });

    expect(result.current.count).toBe(1);
  });

  it("should update multiple times", () => {
    const counter = createDispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
        decrement: (state: { count: number }) => ({ count: state.count - 1 }),
      },
      validNextEvents: {
        increment: ["increment", "decrement"],
        decrement: ["increment", "decrement"],
      },
    });

    const { result } = renderHook(() => useDispatch(counter));

    act(() => {
      counter.dispatch("increment");
      counter.dispatch("increment");
      counter.dispatch("decrement");
    });

    expect(result.current.count).toBe(1);
  });
});

describe("React Hooks - useSelector", () => {
  it("should select derived value", () => {
    const user = createDispatch({
      initialState: {
        firstName: "John",
        lastName: "Doe",
        age: 30,
      },
      events: {
        setFirstName: (state: any, name: string) => ({ firstName: name }),
      },
      validNextEvents: {
        setFirstName: ["setFirstName"],
      },
    });

    const { result } = renderHook(() =>
      useSelector(user, (state) => `${state.firstName} ${state.lastName}`)
    );

    expect(result.current).toBe("John Doe");
  });

  it("should update when selected value changes", () => {
    const user = createDispatch({
      initialState: {
        firstName: "John",
        lastName: "Doe",
      },
      events: {
        setFirstName: (state: any, name: string) => ({ firstName: name }),
      },
      validNextEvents: {
        setFirstName: ["setFirstName"],
      },
    });

    const { result } = renderHook(() =>
      useSelector(user, (state) => state.firstName)
    );

    expect(result.current).toBe("John");

    act(() => {
      user.dispatch("setFirstName", "Jane");
    });

    expect(result.current).toBe("Jane");
  });

  it("should only re-render when selected value changes", () => {
    let renderCount = 0;

    const counter = createDispatch({
      initialState: { count: 0, other: "value" },
      events: {
        increment: (state: any) => ({ count: state.count + 1 }),
        updateOther: (state: any, value: string) => ({ other: value }),
      },
      validNextEvents: {
        increment: ["increment", "updateOther"],
        updateOther: ["increment", "updateOther"],
      },
    });

    const { result } = renderHook(() => {
      renderCount++;
      return useSelector(counter, (state) => state.count);
    });

    const initialRenderCount = renderCount;

    act(() => {
      counter.dispatch("increment");
    });

    // Should re-render when count changes
    expect(renderCount).toBeGreaterThan(initialRenderCount);

    const afterIncrementRenderCount = renderCount;

    act(() => {
      counter.dispatch("updateOther", "new value");
    });

    // Should NOT re-render when count doesn't change
    expect(renderCount).toBe(afterIncrementRenderCount);
  });
});

describe("React Hooks - useCurrentEvent", () => {
  it("should return current event", () => {
    const machine = createDispatch({
      initialState: { value: 0 },
      events: {
        start: (state: { value: number }) => ({ value: 1 }),
        stop: (state: { value: number }) => ({ value: 0 }),
      },
      validNextEvents: {
        start: ["stop"],
        stop: ["start"],
      },
    });

    const { result } = renderHook(() => useCurrentEvent(machine));

    expect(result.current).toBeNull();

    act(() => {
      machine.dispatch("start");
    });

    expect(result.current).toBe("start");

    act(() => {
      machine.dispatch("stop");
    });

    expect(result.current).toBe("stop");
  });
});

describe("React Hooks - useValidNextEvents", () => {
  it("should return valid next events", () => {
    const machine = createDispatch({
      initialState: { status: "idle" },
      events: {
        start: (state: any) => ({ status: "running" }),
        stop: (state: any) => ({ status: "idle" }),
      },
      validNextEvents: {
        start: ["stop"],
        stop: ["start"],
      },
    });

    const { result } = renderHook(() => useValidNextEvents(machine));

    // Initially all events are valid
    expect(result.current).toContain("start");
    expect(result.current).toContain("stop");

    act(() => {
      machine.dispatch("start");
    });

    expect(result.current).toEqual(["stop"]);

    act(() => {
      machine.dispatch("stop");
    });

    expect(result.current).toEqual(["start"]);
  });
});

describe("React Hooks - useMachine", () => {
  it("should return state, dispatch, and machine", () => {
    const counter = createDispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    const { result } = renderHook(() => useMachine(counter));

    const [state, dispatch, machine] = result.current;

    expect(state.count).toBe(0);
    expect(typeof dispatch).toBe("function");
    expect(machine).toBe(counter);
  });

  it("should update state when dispatch is called", () => {
    const counter = createDispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
        add: (state: { count: number }, amount: number) => ({
          count: state.count + amount,
        }),
      },
      validNextEvents: {
        increment: ["increment", "add"],
        add: ["increment", "add"],
      },
    });

    const { result } = renderHook(() => useMachine(counter));

    act(() => {
      const [, dispatch] = result.current;
      dispatch("increment");
    });

    expect(result.current[0].count).toBe(1);

    act(() => {
      const [, dispatch] = result.current;
      dispatch("add", 5);
    });

    expect(result.current[0].count).toBe(6);
  });

  it("should provide access to machine methods", () => {
    const counter = createDispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    const { result } = renderHook(() => useMachine(counter));

    act(() => {
      const [, dispatch] = result.current;
      dispatch("increment");
    });

    const [, , machine] = result.current;

    expect(machine.getCurrentEvent()).toBe("increment");
    expect(machine.getValidNextEvents()).toEqual(["increment"]);
    expect(machine.getState().count).toBe(1);
  });
});

describe("React Hooks - Complex scenarios", () => {
  it("should handle authentication flow", () => {
    type AuthState = {
      status: "idle" | "loading" | "authenticated" | "error";
      user: string | null;
    };

    const auth = createDispatch({
      initialState: {
        status: "idle",
        user: null,
      } as AuthState,
      events: {
        login: (state: AuthState) => ({ status: "loading" as const }),
        success: (state: AuthState, user: string) => ({
          status: "authenticated" as const,
          user,
        }),
        error: (state: AuthState) => ({ status: "error" as const }),
        logout: () => ({ status: "idle" as const, user: null }),
      },
      validNextEvents: {
        login: ["success", "error"],
        success: ["logout"],
        error: ["login"],
        logout: ["login"],
      },
    });

    const { result } = renderHook(() => ({
      state: useDispatch(auth),
      currentEvent: useCurrentEvent(auth),
      validEvents: useValidNextEvents(auth),
    }));

    expect(result.current.state.status).toBe("idle");

    act(() => {
      auth.dispatch("login");
    });

    expect(result.current.state.status).toBe("loading");
    expect(result.current.currentEvent).toBe("login");
    expect(result.current.validEvents).toEqual(["success", "error"]);

    act(() => {
      auth.dispatch("success", "john@example.com");
    });

    expect(result.current.state.status).toBe("authenticated");
    expect(result.current.state.user).toBe("john@example.com");
    expect(result.current.validEvents).toEqual(["logout"]);
  });

  it("should handle multiple components subscribing to same machine", () => {
    const counter = createDispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    const hook1 = renderHook(() => useDispatch(counter));
    const hook2 = renderHook(() => useDispatch(counter));
    const hook3 = renderHook(() =>
      useSelector(counter, (state) => state.count * 2)
    );

    expect(hook1.result.current.count).toBe(0);
    expect(hook2.result.current.count).toBe(0);
    expect(hook3.result.current).toBe(0);

    act(() => {
      counter.dispatch("increment");
    });

    expect(hook1.result.current.count).toBe(1);
    expect(hook2.result.current.count).toBe(1);
    expect(hook3.result.current).toBe(2);
  });
});

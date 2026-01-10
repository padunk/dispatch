import { useSyncExternalStore } from "react";
import type { Dispatch } from "../vanilla";

/**
 * React hook for subscribing to a Dispatch state machine
 *
 * @example
 * ```tsx
 * const counter = createDispatch({
 *   initialState: { count: 0 },
 *   events: {
 *     increment: (state) => ({ count: state.count + 1 }),
 *   },
 *   validNextEvents: { increment: ["increment"] },
 * });
 *
 * function Counter() {
 *   const state = useDispatch(counter);
 *   return <div>Count: {state.count}</div>;
 * }
 * ```
 */
export function useDispatch<
  T,
  E extends Record<string, any> = Record<string, any>,
>(machine: Dispatch<T, E>): T {
  return useSyncExternalStore(
    (callback) => machine.subscribe(callback),
    () => machine.getState(),
    () => machine.getState(), // Server-side rendering support
  );
}

/**
 * React hook for subscribing to a derived value from Dispatch state
 *
 * @example
 * ```tsx
 * function UserName() {
 *   const name = useSelector(userMachine, (state) => state.name);
 *   return <div>Hello, {name}</div>;
 * }
 * ```
 */
export function useSelector<
  T,
  E extends Record<string, any> = Record<string, any>,
  R = any,
>(machine: Dispatch<T, E>, selector: (state: T) => R): R {
  return useSyncExternalStore(
    (callback) => machine.subscribe(callback),
    () => selector(machine.getState()),
    () => selector(machine.getState()), // Server-side rendering support
  );
}

/**
 * React hook that returns the current event name
 *
 * @example
 * ```tsx
 * function EventDisplay() {
 *   const currentEvent = useCurrentEvent(machine);
 *   return <div>Current: {currentEvent || "none"}</div>;
 * }
 * ```
 */
export function useCurrentEvent<
  T,
  E extends Record<string, any> = Record<string, any>,
>(machine: Dispatch<T, E>): Extract<keyof E, string> | null {
  return useSyncExternalStore(
    (callback) => machine.subscribe(callback),
    () => machine.getCurrentEvent(),
    () => machine.getCurrentEvent(),
  );
}

/**
 * React hook that returns the valid next events
 *
 * @example
 * ```tsx
 * function ValidActions() {
 *   const validEvents = useValidNextEvents(machine);
 *   return (
 *     <div>
 *       Can do: {validEvents.join(", ")}
 *     </div>
 *   );
 * }
 * ```
 */
export function useValidNextEvents<
  T,
  E extends Record<string, any> = Record<string, any>,
>(machine: Dispatch<T, E>): string[] {
  return useSyncExternalStore(
    (callback) => machine.subscribe(callback),
    () => machine.getValidNextEvents(),
    () => machine.getValidNextEvents(),
  );
}

/**
 * React hook that provides the full machine API
 * Returns [state, dispatch, machine] tuple
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [state, dispatch, machine] = useMachine(counterMachine);
 *
 *   return (
 *     <div>
 *       <p>Count: {state.count}</p>
 *       <button onClick={() => dispatch("increment")}>+</button>
 *       <p>Valid: {machine.getValidNextEvents().join(", ")}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMachine<
  T,
  E extends Record<string, any> = Record<string, any>,
>(
  machine: Dispatch<T, E>,
): [
  T,
  <K extends Extract<keyof E, string>>(eventName: K, payload?: any) => void,
  Dispatch<T, E>,
] {
  const state = useDispatch(machine);

  const dispatch = <K extends Extract<keyof E, string>>(
    eventName: K,
    payload?: any,
  ) => {
    machine.dispatch(eventName, payload);
  };

  return [state, dispatch, machine];
}

export default useDispatch;

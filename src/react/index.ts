import { useSyncExternalStore } from "use-sync-external-store/shim";
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
export function useDispatch<T>(machine: Dispatch<T>): T {
  return useSyncExternalStore(
    (callback) => machine.subscribe(callback),
    () => machine.getState(),
    () => machine.getState() // Server-side rendering support
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
export function useSelector<T, R>(
  machine: Dispatch<T>,
  selector: (state: T) => R
): R {
  return useSyncExternalStore(
    (callback) => machine.subscribe(callback),
    () => selector(machine.getState()),
    () => selector(machine.getState()) // Server-side rendering support
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
export function useCurrentEvent<T>(machine: Dispatch<T>): string | null {
  return useSyncExternalStore(
    (callback) => machine.subscribe(callback),
    () => machine.getCurrentEvent(),
    () => machine.getCurrentEvent()
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
export function useValidNextEvents<T>(machine: Dispatch<T>): string[] {
  return useSyncExternalStore(
    (callback) => machine.subscribe(callback),
    () => machine.getValidNextEvents().join(","), // Convert to string for stable reference
    () => machine.getValidNextEvents().join(",")
  )
    .split(",")
    .filter(Boolean); // Convert back to array, filtering empty strings
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
export function useMachine<T>(
  machine: Dispatch<T>
): [T, (eventName: string, payload?: any) => void, Dispatch<T>] {
  const state = useDispatch(machine);

  const dispatch = (eventName: string, payload?: any) => {
    machine.dispatch(eventName, payload);
  };

  return [state, dispatch, machine];
}

export default useDispatch;

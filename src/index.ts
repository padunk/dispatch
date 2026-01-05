// Type-safe builders (recommended API)
export { createDispatch, createValidatedDispatch } from "./vanilla/builder";

// Types
export type { Dispatch, DispatchEvents, StateUpdater } from "./vanilla";

// React hooks
export {
  useDispatch,
  useSelector,
  useCurrentEvent,
  useValidNextEvents,
  useMachine,
} from "./react";

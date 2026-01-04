// Type-safe builders (recommended API)
export { createDispatch, createValidatedDispatch } from "./vanilla/builder";

// Types
export type { Dispatch } from "./vanilla";

// React hooks
export {
  useDispatch,
  useSelector,
  useCurrentEvent,
  useValidNextEvents,
  useMachine,
} from "./react";

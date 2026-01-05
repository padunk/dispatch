import { z } from "zod";
import { Dispatch, DispatchEvents } from "./index";

/**
 * Type-safe builder for creating Dispatch instances with validated event transitions
 *
 * @example
 * ```ts
 * const machine = createDispatch({
 *   initialState: { count: 0 },
 *   events: {
 *     increment: (state) => ({ count: state.count + 1 }),
 *     decrement: (state) => ({ count: state.count - 1 }),
 *     reset: () => ({ count: 0 }),
 *   },
 *   validNextEvents: {
 *     increment: ["decrement", "reset"],
 *     decrement: ["increment"],
 *     reset: ["increment"],
 *   },
 * });
 * ```
 */
export function createDispatch<
  Data,
  Events extends DispatchEvents<Data>,
>(config: {
  initialState: Data;
  events: Events;
  validNextEvents: {
    [K in keyof Events]?: Array<Extract<keyof Events, string>>;
  };
  schema?: z.ZodSchema<Data>;
}): Dispatch<Data, Events> {
  const { initialState, events, validNextEvents, schema } = config;

  // Validate initial state with Zod schema if provided
  if (schema) {
    const result = schema.safeParse(initialState);
    if (!result.success) {
      throw new Error(
        `Initial state validation failed: ${result.error.message}`
      );
    }
  }

  // Validate that all referenced events in validNextEvents actually exist
  const eventNames = Object.keys(events);
  for (const [event, nextEvents] of Object.entries(validNextEvents)) {
    if (!eventNames.includes(event)) {
      throw new Error(
        `validNextEvents references unknown event: "${event}". Available events: ${eventNames.join(
          ", "
        )}`
      );
    }
    if (Array.isArray(nextEvents)) {
      for (const nextEvent of nextEvents) {
        if (!eventNames.includes(nextEvent)) {
          throw new Error(
            `validNextEvents["${event}"] references unknown event: "${nextEvent}". Available events: ${eventNames.join(
              ", "
            )}`
          );
        }
      }
    }
  }

  // Convert the typed validNextEvents to the format expected by Dispatch
  const validNextEventsRecord: Record<string, string[]> = {};
  for (const key in validNextEvents) {
    validNextEventsRecord[key] = validNextEvents[key] || [];
  }

  return new Dispatch({
    initialState,
    events,
    validNextEvents: validNextEventsRecord,
  });
}

/**
 * Creates a validated Dispatch instance with Zod schema validation
 *
 * @example
 * ```ts
 * const CounterSchema = z.object({
 *   count: z.number().min(0),
 *   max: z.number().optional(),
 * });
 *
 * const counter = createValidatedDispatch({
 *   schema: CounterSchema,
 *   initialState: { count: 0 },
 *   events: {
 *     increment: (state) => ({ count: state.count + 1 }),
 *   },
 *   validNextEvents: {
 *     increment: ["increment"],
 *   },
 * });
 * ```
 */
export function createValidatedDispatch<
  Data extends z.infer<Schema>,
  Schema extends z.ZodSchema,
  Events extends DispatchEvents<Data>,
>(config: {
  schema: Schema;
  initialState: Data;
  events: Events;
  validNextEvents: {
    [K in keyof Events]?: Array<Extract<keyof Events, string>>;
  };
}): Dispatch<Data, Events> {
  // Use any to bypass strict type checking during internal call
  return createDispatch(config as any) as Dispatch<Data, Events>;
}

export default createDispatch;

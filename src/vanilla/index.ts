import { produce, Draft } from "immer";

// Support both return-style and draft-style updates
type StateUpdater<D, P = void> = P extends void
  ? (state: D) => Partial<D> | void | ((draft: Draft<D>) => void)
  : (state: D, payload: P) => Partial<D> | void | ((draft: Draft<D>) => void);

type DispatchEvents<D> = Record<string, StateUpdater<D, any>>;

type DispatchParams<D> = {
  initialState: D;
  events: DispatchEvents<D>;
  validNextEvents: Record<string, string[]>;
};

export class Dispatch<Data> {
  #initialState: Data;
  #state: Data;
  #events: DispatchEvents<Data>;
  #validNextEvents: Record<string, string[]>;
  #currentEvent: string | null;
  #listeners: Set<(state: Data) => void>;

  constructor({ initialState, events, validNextEvents }: DispatchParams<Data>) {
    this.#initialState = produce(initialState, () => {});
    this.#state = produce(initialState, () => {});

    // events
    this.#events = events;
    this.#validNextEvents = validNextEvents;
    this.#currentEvent = null;

    // listeners
    this.#listeners = new Set();
  }

  // Public API
  dispatch(eventName: string, payload?: any): void {
    // Validate event exists
    if (!this.#events[eventName]) {
      throw new Error(`Event "${eventName}" does not exist`);
    }

    // Validate transition is allowed
    if (this.#currentEvent !== null) {
      const validNext = this.#validNextEvents[this.#currentEvent];
      if (!Array.isArray(validNext)) {
        throw new Error("Valid Next Events should be an array of string");
      }

      // if validNext === [], assume all events is valid
      if (validNext.length > 0 && !validNext.includes(eventName)) {
        throw new Error(
          `Cannot transition from "${
            this.#currentEvent
          }" to "${eventName}". Valid next events: ${
            validNext?.join(", ") || "none"
          }`
        );
      }
    }

    // Execute the event handler and update state using Immer
    const updater = this.#events[eventName];
    this.#state = produce(this.#state, (draft) => {
      const result = updater(draft as Data, payload);

      // If updater returns a partial object, merge it
      if (
        result &&
        typeof result === "object" &&
        typeof result !== "function"
      ) {
        Object.assign(draft as any, result);
      }
      // If it returns void or a function, Immer handles the draft mutations
    });

    // Track current event
    this.#currentEvent = eventName;

    // Notify listeners
    this.#listeners.forEach((listener) => listener(this.#state));
  }

  subscribe(listener: (state: Data) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  getState(): Data {
    return produce(this.#state, () => {});
  }

  getCurrentEvent(): string | null {
    return this.#currentEvent;
  }

  getValidNextEvents(): string[] {
    if (this.#currentEvent === null) {
      // At the start, all events are valid
      return Object.keys(this.#events);
    }
    return this.#validNextEvents[this.#currentEvent] || [];
  }

  resetState(): void {
    this.#state = produce(this.#initialState, () => {});
    this.#currentEvent = null;
  }
}

export default Dispatch;

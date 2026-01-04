import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createDispatch, createValidatedDispatch } from "../vanilla/builder";

describe("createDispatch - Type-safe builder", () => {
  it("should create a Dispatch instance with type-safe event names", () => {
    const counter = createDispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
        decrement: (state: { count: number }) => ({ count: state.count - 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
        decrement: ["increment"],
      },
    });

    counter.dispatch("increment");
    expect(counter.getState().count).toBe(1);
  });

  it("should throw error for invalid event in validNextEvents", () => {
    expect(() => {
      createDispatch({
        initialState: { count: 0 },
        events: {
          increment: (state: { count: number }) => ({ count: state.count + 1 }),
        },
        validNextEvents: {
          increment: ["nonexistent" as any],
        },
      });
    }).toThrow('references unknown event: "nonexistent"');
  });

  it("should throw error for unknown event key in validNextEvents", () => {
    expect(() => {
      createDispatch({
        initialState: { count: 0 },
        events: {
          increment: (state: { count: number }) => ({ count: state.count + 1 }),
        },
        validNextEvents: {
          increment: ["increment"],
          unknown: ["increment"],
        } as any,
      });
    }).toThrow('references unknown event: "unknown"');
  });

  it("should allow empty validNextEvents arrays", () => {
    const counter = createDispatch({
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: [],
      },
    });

    counter.dispatch("increment");
    // Empty array means all events are valid
    counter.dispatch("increment");
    expect(counter.getState().count).toBe(2);
  });

  it("should work with complex state", () => {
    type AuthState = {
      status: "idle" | "loading" | "authenticated" | "error";
      user: string | null;
    };

    const auth = createDispatch<AuthState, any>({
      initialState: { status: "idle", user: null } as AuthState,
      events: {
        login: (state: AuthState) => ({ status: "loading" as const }),
        success: (state: AuthState) => ({
          status: "authenticated" as const,
          user: "test@example.com",
        }),
        logout: (state: AuthState) => ({ status: "idle" as const, user: null }),
      },
      validNextEvents: {
        login: ["success"],
        success: ["logout"],
        logout: ["login"],
      },
    });

    auth.dispatch("login");
    expect(auth.getState().status).toBe("loading");

    auth.dispatch("success");
    expect(auth.getState().status).toBe("authenticated");
    expect(auth.getState().user).toBe("test@example.com");
  });
});

describe("createValidatedDispatch - Zod schema validation", () => {
  it("should validate initial state with schema", () => {
    const CounterSchema = z.object({
      count: z.number().min(0),
    });

    const counter = createValidatedDispatch({
      schema: CounterSchema,
      initialState: { count: 0 },
      events: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
      },
      validNextEvents: {
        increment: ["increment"],
      },
    });

    counter.dispatch("increment");
    expect(counter.getState().count).toBe(1);
  });

  it("should throw error for invalid initial state", () => {
    const CounterSchema = z.object({
      count: z.number().min(0),
    });

    expect(() => {
      createValidatedDispatch({
        schema: CounterSchema,
        initialState: { count: -1 }, // Invalid: negative number
        events: {
          increment: (state: { count: number }) => ({ count: state.count + 1 }),
        },
        validNextEvents: {},
      });
    }).toThrow("Initial state validation failed");
  });

  it("should work with complex schemas", () => {
    const UserSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0).max(150),
      email: z.email(),
    });

    type User = z.infer<typeof UserSchema>;

    const user = createValidatedDispatch({
      schema: UserSchema,
      initialState: {
        name: "John",
        age: 30,
        email: "john@example.com",
      },
      events: {
        updateName: (state: User, payload: string) => ({ name: payload }),
        updateAge: (state: User, payload: number) => ({ age: payload }),
      },
      validNextEvents: {
        updateName: ["updateAge"],
        updateAge: ["updateName"],
      },
    });

    user.dispatch("updateName", "Jane");
    expect(user.getState().name).toBe("Jane");

    user.dispatch("updateAge", 25);
    expect(user.getState().age).toBe(25);
  });

  it("should validate nested objects", () => {
    const TodoSchema = z.object({
      id: z.number(),
      text: z.string().min(1),
      completed: z.boolean(),
    });

    const TodosSchema = z.object({
      items: z.array(TodoSchema),
      filter: z.enum(["all", "active", "completed"]),
    });

    type TodosState = z.infer<typeof TodosSchema>;

    expect(() => {
      createValidatedDispatch({
        schema: TodosSchema,
        initialState: {
          items: [{ id: 1, text: "", completed: false }], // Invalid: empty text
          filter: "all",
        } as TodosState,
        events: {
          addTodo: (state: TodosState) => state,
        },
        validNextEvents: {},
      });
    }).toThrow("Initial state validation failed");
  });

  it("should work with draft-style mutations", () => {
    const ItemsSchema = z.object({
      items: z.array(z.number()),
    });

    type ItemsState = z.infer<typeof ItemsSchema>;

    const items = createValidatedDispatch({
      schema: ItemsSchema,
      initialState: { items: [1, 2, 3] },
      events: {
        addItem: (draft: ItemsState, payload: number) => {
          draft.items.push(payload);
        },
        removeItem: (draft: ItemsState, payload: number) => {
          draft.items = draft.items.filter((item) => item !== payload);
        },
      },
      validNextEvents: {
        addItem: ["addItem", "removeItem"],
        removeItem: ["addItem"],
      },
    });

    items.dispatch("addItem", 4);
    expect(items.getState().items).toEqual([1, 2, 3, 4]);

    items.dispatch("removeItem", 2);
    expect(items.getState().items).toEqual([1, 3, 4]);
  });
});

describe("Type safety at compile time", () => {
  it("should enforce event names in validNextEvents", () => {
    // This test primarily demonstrates compile-time type safety
    // TypeScript will error if you try to use non-existent event names

    const machine = createDispatch({
      initialState: { value: 0 },
      events: {
        increment: (state: { value: number }) => ({ value: state.value + 1 }),
        decrement: (state: { value: number }) => ({ value: state.value - 1 }),
        reset: () => ({ value: 0 }),
      },
      validNextEvents: {
        // These are all valid event names
        increment: ["decrement", "reset"],
        decrement: ["increment", "reset"],
        reset: ["increment"],

        // TypeScript would error on:
        // increment: ["nonexistent"], // ❌ Type error
        // unknownEvent: ["increment"], // ❌ Type error
      },
    });

    expect(machine).toBeDefined();
  });
});

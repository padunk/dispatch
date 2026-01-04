import { z } from "zod";
import { createDispatch, createValidatedDispatch } from "../src";

// Example 1: Type-safe event transitions without Zod
console.log("=== Example 1: Type-safe transitions ===\n");

const counter = createDispatch({
  initialState: { count: 0 },
  events: {
    increment: (state: { count: number }) => ({ count: state.count + 1 }),
    decrement: (state: { count: number }) => ({ count: state.count - 1 }),
    reset: () => ({ count: 0 }),
  },
  validNextEvents: {
    // TypeScript will autocomplete and validate these event names!
    increment: ["increment", "decrement", "reset"],
    decrement: ["increment", "decrement", "reset"],
    reset: ["increment"],
    // tryingToAddInvalidEvent: ["nonexistent"], // ❌ TypeScript error!
  },
});

counter.subscribe((state) => {
  console.log(`  Count: ${state.count}`);
});

counter.dispatch("increment"); // 1
counter.dispatch("decrement"); // 0
counter.dispatch("reset"); // 0

console.log("\n");

// Example 2: Using Zod schema validation
console.log("=== Example 2: Zod Schema Validation ===\n");

const UserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0).max(150),
  email: z.string().email(),
  role: z.enum(["user", "admin"]),
});

type User = z.infer<typeof UserSchema>;

const userMachine = createValidatedDispatch({
  schema: UserSchema,
  initialState: {
    name: "John Doe",
    age: 30,
    email: "john@example.com",
    role: "user",
  } as User,
  events: {
    updateName: (state: User, payload: string) => ({ name: payload }),
    updateAge: (state: User, payload: number) => ({ age: payload }),
    promoteToAdmin: (state: User): Partial<User> => ({
      role: "admin" as const,
    }),
    demoteToUser: (state: User): Partial<User> => ({ role: "user" as const }),
  },
  validNextEvents: {
    updateName: ["updateName", "updateAge", "promoteToAdmin"],
    updateAge: ["updateName", "updateAge", "promoteToAdmin"],
    promoteToAdmin: ["demoteToUser"],
    demoteToUser: ["promoteToAdmin"],
  },
});

userMachine.subscribe((state) => {
  console.log(`  User: ${state.name} (${state.role}), Age: ${state.age}`);
});

userMachine.dispatch("updateName", "Jane Smith");
userMachine.dispatch("updateAge", 28);
userMachine.dispatch("promoteToAdmin");

console.log("\n");

// Example 3: Nested state with Zod validation
console.log("=== Example 3: Complex State Validation ===\n");

const TodoItemSchema = z.object({
  id: z.number(),
  text: z.string().min(1),
  completed: z.boolean(),
});

const TodosSchema = z.object({
  items: z.array(TodoItemSchema),
  filter: z.enum(["all", "active", "completed"]),
});

type TodosState = z.infer<typeof TodosSchema>;

const todos = createValidatedDispatch({
  schema: TodosSchema,
  initialState: {
    items: [],
    filter: "all",
  } as TodosState,
  events: {
    addTodo: (draft: TodosState, payload: { id: number; text: string }) => {
      draft.items.push({
        id: payload.id,
        text: payload.text,
        completed: false,
      });
    },
    toggleTodo: (draft: TodosState, payload: { id: number }) => {
      const todo = draft.items.find((item) => item.id === payload.id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    setFilter: (draft: TodosState, payload: "all" | "active" | "completed") => {
      draft.filter = payload;
    },
  },
  validNextEvents: {
    addTodo: ["addTodo", "toggleTodo", "setFilter"],
    toggleTodo: ["addTodo", "toggleTodo", "setFilter"],
    setFilter: ["addTodo", "toggleTodo", "setFilter"],
  },
});

todos.subscribe((state) => {
  console.log(
    `  Todos (${state.filter}): ${state.items.length} items, ${
      state.items.filter((t) => t.completed).length
    } completed`
  );
});

todos.dispatch("addTodo", { id: 1, text: "Learn TypeScript" });
todos.dispatch("addTodo", { id: 2, text: "Build state machine" });
todos.dispatch("toggleTodo", { id: 1 });
todos.dispatch("setFilter", "completed");

console.log("\n");

// Example 4: Runtime validation catching errors
console.log("=== Example 4: Runtime Validation ===\n");

try {
  const invalidUser = createValidatedDispatch({
    schema: UserSchema,
    initialState: {
      name: "", // ❌ Invalid: name too short
      age: -5, // ❌ Invalid: negative age
      email: "not-an-email", // ❌ Invalid: not an email
      role: "user",
    } as User,
    events: {
      updateName: (state: User, payload: string) => ({ name: payload }),
    },
    validNextEvents: {},
  });
} catch (error) {
  console.log("  ✓ Caught validation error:");
  console.log(`    ${(error as Error).message}`);
}

console.log("\n");

// Example 5: Catching invalid event references at runtime
console.log("=== Example 5: Invalid Event Reference ===\n");

try {
  const broken = createDispatch({
    initialState: { count: 0 },
    events: {
      increment: (state: { count: number }) => ({ count: state.count + 1 }),
    },
    validNextEvents: {
      increment: ["nonexistent" as any], // Will be caught at runtime
    },
  });
} catch (error) {
  console.log("  ✓ Caught invalid event reference:");
  console.log(`    ${(error as Error).message}`);
}

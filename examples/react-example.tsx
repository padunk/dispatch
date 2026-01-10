import React from "react";
import { createDispatch } from "../src";
import {
  useDispatch,
  useSelector,
  useMachine,
  useValidNextEvents,
} from "../src/react";

// Example 1: Counter with useDispatch
const counterMachine = createDispatch({
  initialState: { count: 0 },
  events: {
    increment: (state: { count: number }) => ({ count: state.count + 1 }),
    decrement: (state: { count: number }) => ({ count: state.count - 1 }),
    reset: () => ({ count: 0 }),
  },
  validNextEvents: {
    increment: ["increment", "decrement", "reset"],
    decrement: ["increment", "decrement", "reset"],
    reset: ["increment"],
  },
});

function Counter() {
  const state = useDispatch(counterMachine);

  return (
    <div>
      <h2>Counter: {state.count}</h2>
      <button onClick={() => counterMachine.dispatch("increment")}>+</button>
      <button onClick={() => counterMachine.dispatch("decrement")}>-</button>
      <button onClick={() => counterMachine.dispatch("reset")}>Reset</button>
    </div>
  );
}

// Example 2: Counter with useMachine (more convenient)
function CounterWithMachine() {
  const [state, dispatch] = useMachine(counterMachine);

  return (
    <div>
      <h2>Counter: {state.count}</h2>
      <button onClick={() => dispatch("increment")}>+</button>
      <button onClick={() => dispatch("decrement")}>-</button>
      <button onClick={() => dispatch("reset")}>Reset</button>
    </div>
  );
}

// Example 3: Using useSelector for derived values
const userMachine = createDispatch({
  initialState: {
    firstName: "John",
    lastName: "Doe",
    age: 30,
  },
  events: {
    setFirstName: (state: any, name: string) => ({ firstName: name }),
    setLastName: (state: any, name: string) => ({ lastName: name }),
    setAge: (state: any, age: number) => ({ age }),
  },
  validNextEvents: {
    setFirstName: ["setFirstName", "setLastName", "setAge"],
    setLastName: ["setFirstName", "setLastName", "setAge"],
    setAge: ["setFirstName", "setLastName", "setAge"],
  },
});

function UserProfile() {
  // Only re-renders when fullName changes
  const fullName = useSelector(
    userMachine,
    (state) => `${state.firstName} ${state.lastName}`,
  );
  const age = useSelector(userMachine, (state) => state.age);

  return (
    <div>
      <h2>{fullName}</h2>
      <p>Age: {age}</p>
      <input
        placeholder="First Name"
        onChange={(e) => userMachine.dispatch("setFirstName", e.target.value)}
      />
      <input
        placeholder="Last Name"
        onChange={(e) => userMachine.dispatch("setLastName", e.target.value)}
      />
      <input
        type="number"
        placeholder="Age"
        onChange={(e) =>
          userMachine.dispatch("setAge", parseInt(e.target.value))
        }
      />
    </div>
  );
}

// Example 4: Authentication Flow
type AuthState = {
  status: "idle" | "loading" | "authenticated" | "error";
  user: string | null;
  error: string | null;
};

const authMachine = createDispatch({
  initialState: {
    status: "idle",
    user: null,
    error: null,
  } as AuthState,
  events: {
    login: (state: AuthState) => ({
      status: "loading" as const,
      error: null,
    }),
    loginSuccess: (state: AuthState, user: string) => ({
      status: "authenticated" as const,
      user,
      error: null,
    }),
    loginError: (state: AuthState, error: string) => ({
      status: "error" as const,
      user: null,
      error,
    }),
    logout: () => ({
      status: "idle" as const,
      user: null,
      error: null,
    }),
  },
  validNextEvents: {
    login: ["loginSuccess", "loginError"],
    loginSuccess: ["logout"],
    loginError: ["login"],
    logout: ["login"],
  },
});

function AuthExample() {
  const [state, dispatch] = useMachine(authMachine);
  const validEvents = useValidNextEvents(authMachine);

  const handleLogin = async () => {
    dispatch("login");

    // Simulate API call
    setTimeout(() => {
      if (Math.random() > 0.5) {
        dispatch("loginSuccess", "john@example.com");
      } else {
        dispatch("loginError", "Invalid credentials");
      }
    }, 1000);
  };

  return (
    <div>
      <h2>Auth Status: {state.status}</h2>
      {state.user && <p>User: {state.user}</p>}
      {state.error && <p style={{ color: "red" }}>Error: {state.error}</p>}

      {state.status === "idle" && <button onClick={handleLogin}>Login</button>}

      {state.status === "loading" && <p>Loading...</p>}

      {state.status === "authenticated" && (
        <button onClick={() => dispatch("logout")}>Logout</button>
      )}

      {state.status === "error" && <button onClick={handleLogin}>Retry</button>}

      <p>
        <small>Valid actions: {validEvents.join(", ")}</small>
      </p>
    </div>
  );
}

// Example 5: Todo List with Complex State
type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

type TodosState = {
  items: Todo[];
  filter: "all" | "active" | "completed";
};

const todosachine = createDispatch({
  initialState: {
    items: [],
    filter: "all",
  } as TodosState,
  events: {
    addTodo: (draft: TodosState, text: string) => {
      draft.items.push({
        id: Date.now(),
        text,
        completed: false,
      });
    },
    toggleTodo: (draft: TodosState, id: number) => {
      const todo = draft.items.find((t) => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    deleteTodo: (draft: TodosState, id: number) => {
      draft.items = draft.items.filter((t) => t.id !== id);
    },
    setFilter: (draft: TodosState, filter: "all" | "active" | "completed") => {
      draft.filter = filter;
    },
  },
  validNextEvents: {
    addTodo: ["addTodo", "toggleTodo", "deleteTodo", "setFilter"],
    toggleTodo: ["addTodo", "toggleTodo", "deleteTodo", "setFilter"],
    deleteTodo: ["addTodo", "toggleTodo", "deleteTodo", "setFilter"],
    setFilter: ["addTodo", "toggleTodo", "deleteTodo", "setFilter"],
  },
});

function TodoApp() {
  const [state, dispatch] = useMachine(todosachine);
  const [input, setInput] = React.useState("");

  // Derived value - only filtered todos
  const filteredTodos = useSelector(todosachine, (state) => {
    if (state.filter === "all") return state.items;
    if (state.filter === "active")
      return state.items.filter((t) => !t.completed);
    return state.items.filter((t) => t.completed);
  });

  const handleAddTodo = () => {
    if (input.trim()) {
      dispatch("addTodo", input);
      setInput("");
    }
  };

  return (
    <div>
      <h2>Todo List</h2>

      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
          placeholder="What needs to be done?"
        />
        <button onClick={handleAddTodo}>Add</button>
      </div>

      <div>
        <button onClick={() => dispatch("setFilter", "all")}>All</button>
        <button onClick={() => dispatch("setFilter", "active")}>Active</button>
        <button onClick={() => dispatch("setFilter", "completed")}>
          Completed
        </button>
        <span> (Filter: {state.filter})</span>
      </div>

      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch("toggleTodo", todo.id)}
            />
            <span
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.text}
            </span>
            <button onClick={() => dispatch("deleteTodo", todo.id)}>×</button>
          </li>
        ))}
      </ul>

      <p>{state.items.filter((t) => !t.completed).length} items left</p>
    </div>
  );
}

// Main App component
export default function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Dispatch React Examples</h1>

      <section>
        <h3>Example 1: Counter</h3>
        <Counter />
      </section>

      <section>
        <h3>Example 2: Counter with useMachine</h3>
        <CounterWithMachine />
      </section>

      <section>
        <h3>Example 3: User Profile</h3>
        <UserProfile />
      </section>

      <section>
        <h3>Example 4: Authentication</h3>
        <AuthExample />
      </section>

      <section>
        <h3>Example 5: Todo App</h3>
        <TodoApp />
      </section>
    </div>
  );
}

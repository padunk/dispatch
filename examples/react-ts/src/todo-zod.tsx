import { createValidatedDispatch, useMachine } from "@rustyrush/dispatch";
import { useEffect, useRef, useState } from "react";
import z from "zod";

const TodoSchema = z.object({
  id: z.number(),
  title: z.string().min(5),
  description: z.string(),
  isComplete: z.boolean(),
});

const TodosSchema = z.object({
  todos: TodoSchema.array(),
});

type Todo = z.infer<typeof TodoSchema>;

const todo = createValidatedDispatch({
  schema: TodosSchema,
  initialState: {
    todos: [
      {
        id: 1,
        title: "Learn Dispatch",
        description: "Learn how to use Dispatch library",
        isComplete: false,
      },
    ],
  },
  events: {
    addTodo: (draft, payload: Todo) => {
      draft.todos.push(payload);
    },
    toggleTodo: (draft, id: number) => {
      const todo = draft.todos.find((t) => t.id === id);
      if (todo) todo.isComplete = !todo.isComplete;
    },
    removeTodo: (draft, id: number) => {
      const index = draft.todos.findIndex((t) => t.id === id);
      if (index > -1) draft.todos.splice(index, 1);
    },
  },
  validNextEvents: {
    addTodo: [],
    toggleTodo: [],
    removeTodo: [],
  },
});

export default function Todo() {
  const [{ todos }, dispatch] = useMachine(todo);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleRemove = (id: number) => {
    dispatch("removeTodo", id);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    dispatch("addTodo", {
      id: Date.now(),
      title,
      description,
      isCompleted: false,
    });

    setTitle("");
    setDescription("");

    titleRef.current?.focus();
  };

  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (titleRef) titleRef.current?.focus();
  }, []);

  return (
    <div>
      <h1>Todo</h1>
      <div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "6px" }}
        >
          <input
            ref={titleRef}
            autoFocus
            type="text"
            name="title"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            name="description"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      </div>
      <ul>
        {todos.map((todo) => {
          return (
            <li
              key={todo.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                border: "1px solid gray",
                borderRadius: "6px",
                padding: "6px",
                backgroundColor: "mediumslateblue",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <p>{todo.title}</p>
                <p>{todo.description}</p>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  name="done"
                  id="done"
                  checked={todo.isComplete}
                  onChange={() => dispatch("toggleTodo", todo.id)}
                />
                <button type="button" onClick={() => handleRemove(todo.id)}>
                  X
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

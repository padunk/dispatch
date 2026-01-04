import reactLogo from "./assets/react.svg";
import "./App.css";
import {
  createDispatch,
  useDispatch,
  type DispatchEvents,
} from "@rusty-rush/dispatch";

type Counter = {
  count: number;
};

const counter = createDispatch<Counter, DispatchEvents<Counter>>({
  initialState: { count: 0 },
  events: {
    increment: (state: Counter) => ({ count: state.count + 1 }),
    decrement: (state: Counter) => ({ count: state.count - 1 }),
  },
  validNextEvents: {
    increment: ["increment", "decrement"],
    decrement: ["increment", "decrement"],
  },
});

function App() {
  const state = useDispatch(counter);

  return (
    <>
      <div>
        <a href="https://github.com/padunk/dispatch" target="_blank">
          <img src="" className="logo" alt="Dispatch logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Dispatch + React</h1>
      <div className="card">
        <button onClick={() => counter.dispatch("increment")}>
          count is {state.count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Dispatch and React logos to learn more
      </p>
    </>
  );
}

export default App;

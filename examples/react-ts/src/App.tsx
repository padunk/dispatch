import * as React from "react";
import { createDispatch, useDispatch } from "@rustyrush/dispatch";

import reactLogo from "./assets/react.svg";
import dispatchLogo from "./assets/dispatch-logo.svg";
import "./App.css";
import type { DispatchEvents } from "../../../dist/vanilla";

type TrafficLight = {
  trafficLight: string;
};

const trafficLightAdmin = createDispatch<
  TrafficLight,
  DispatchEvents<TrafficLight>
>({
  initialState: { trafficLight: "red" },
  events: {
    toRed: () => ({ trafficLight: "red" }),
    toYellow: () => ({ trafficLight: "yellow" }),
    toGreen: () => ({ trafficLight: "green" }),
  },
  validNextEvents: {
    toRed: ["toYellow"],
    toYellow: ["toGreen"],
    toGreen: ["toRed"],
  },
});

function App() {
  const state = useDispatch(trafficLightAdmin);

  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleLight = () => {
    const currentLight = state.trafficLight;

    if (!currentLight) return;

    if (!running) setRunning(true);

    switch (currentLight) {
      case "red":
        trafficLightAdmin.dispatch("toYellow");
        break;
      case "yellow":
        trafficLightAdmin.dispatch("toGreen");
        break;
      case "green":
        trafficLightAdmin.dispatch("toRed");
        break;
      default:
        throw Error("Unknown state");
    }
  };

  const oopsWrongEvent = () => {
    const currentLight = state.trafficLight;

    if (!currentLight) return;

    try {
      switch (currentLight) {
        case "red":
          trafficLightAdmin.dispatch("toRed");
          break;
        case "yellow":
          trafficLightAdmin.dispatch("toRed");
          break;
        case "green":
          trafficLightAdmin.dispatch("toYellow");
          break;
        default:
          throw Error("Unknown state");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "You got me!");
    }
  };

  return (
    <>
      <div>
        <a href="https://github.com/padunk/dispatch" target="_blank">
          <img src={dispatchLogo} className="logo" alt="Dispatch logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Dispatch in React</h1>
      <div className="card">
        <div className="traffic-light">
          <div
            className={`light red ${state.trafficLight !== "red" && "dim"}`}
          ></div>
          <div
            className={`light yellow ${state.trafficLight !== "yellow" && "dim"}`}
          ></div>
          <div
            className={`light green ${state.trafficLight !== "green" && "dim"}`}
          ></div>
        </div>
        <div className="button-group">
          <button onClick={handleLight}>Next Light</button>
          {running && <button onClick={oopsWrongEvent}>Oops</button>}
        </div>
        {error && (
          <>
            <p className="error-text">Oops wrong event:</p>
            <p className="error-text">{error}</p>
          </>
        )}
        <p>
          Edit <code>src/App.tsx</code> and save to test DispatchJS
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Dispatch and React logos to learn more
      </p>
    </>
  );
}

export default App;

import { Dispatch } from "../src";

// Example: User Authentication Flow
console.log("=== Example : Authentication Flow ===\n");

type AuthState = {
  status: "idle" | "loading" | "authenticated" | "error";
  user: string | null;
  error: string | null;
};

const authMachine = new Dispatch<AuthState>({
  initialState: {
    status: "idle",
    user: null,
    error: null,
  },
  events: {
    login: (state: AuthState) => ({
      status: "loading" as const,
      error: null,
    }),
    loginSuccess: (state: AuthState) => ({
      status: "authenticated" as const,
      user: "john@example.com",
    }),
    loginError: (state: AuthState) => ({
      status: "error" as const,
      error: "Invalid credentials",
    }),
    logout: (state: AuthState) => ({
      status: "idle" as const,
      user: null,
      error: null,
    }),
    retry: (state: AuthState) => ({
      status: "idle" as const,
      error: null,
    }),
  },
  validNextEvents: {
    login: ["loginSuccess", "loginError"],
    loginSuccess: ["logout"],
    loginError: ["retry", "login"],
    logout: ["login"],
    retry: ["login"],
  },
});

authMachine.subscribe((state) => {
  console.log(
    `  Status: ${state.status}, User: ${state.user}, Error: ${state.error}`
  );
});

authMachine.dispatch("login");
authMachine.dispatch("loginSuccess");
console.log("  Valid next events:", authMachine.getValidNextEvents());
authMachine.dispatch("logout");
authMachine.dispatch("login");
authMachine.dispatch("loginError");
console.log("  Valid next events:", authMachine.getValidNextEvents());
authMachine.dispatch("retry");

console.log("\n");

// Example 2: Traffic Light
console.log("=== Example 3: Traffic Light ===\n");

type TrafficLightState = {
  color: "red" | "yellow" | "green";
  timer: number;
};

const trafficLight = new Dispatch<TrafficLightState>({
  initialState: {
    color: "red",
    timer: 0,
  },
  events: {
    toGreen: (state: TrafficLightState) => ({
      color: "green" as const,
      timer: 30,
    }),
    toYellow: (state: TrafficLightState) => ({
      color: "yellow" as const,
      timer: 5,
    }),
    toRed: (state: TrafficLightState) => ({ color: "red" as const, timer: 30 }),
  },
  validNextEvents: {
    toRed: ["toGreen"],
    toGreen: ["toYellow"],
    toYellow: ["toRed"],
  },
});

trafficLight.subscribe((state) => {
  console.log(`  🚦 ${state.color.toUpperCase()} (${state.timer}s)`);
});

trafficLight.dispatch("toGreen");
trafficLight.dispatch("toYellow");
trafficLight.dispatch("toRed");
trafficLight.dispatch("toGreen");

console.log("\n");

// Example 3: Error handling
console.log("=== Example 4: Error Handling ===\n");

try {
  trafficLight.dispatch("toGreen"); // Invalid transition from green
} catch (error) {
  console.log(`  ✓ Caught error: ${(error as Error).message}`);
}

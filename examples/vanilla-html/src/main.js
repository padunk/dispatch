import { createDispatch } from "@rustyrush/dispatch";

const count = document.getElementById("count");
const incrementButton = document.getElementById("increment");
const decrementButton = document.getElementById("decrement");

const counter = createDispatch({
  initialState: {
    count: 1,
  },
  events: {
    inc: (s) => ({ count: s.count + 1 }),
    dec: (s) => ({ count: s.count - 1 }),
  },
  validNextEvents: {
    inc: ["inc", "dec"],
    dec: ["dec", "inc"],
  },
});

counter.subscribe((s) => {
  count.innerText = s.count;
});

incrementButton.addEventListener("click", () => {
  counter.dispatch("inc");
});

decrementButton.addEventListener("click", () => {
  counter.dispatch("dec");
});

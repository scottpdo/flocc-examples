export const meta = {
  title: 'Elementary Cellular Automata',
  description: 'Lorem ipsum',
  topics: ["Information Theory"],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `Cellular automata (CA) are discrete models that usually take place on a grid (or lattice), with cells that take action based on their own state (for example, “on” or “off”) and the state of nearby cells. The Game of Life is an example of a cellular automata. Elementary cellular automata are a special type of CA that take place on a 1-dimensional grid (a single row).

Reading from top to bottom, each visualized row represents the state of the cells over time. Each rule from 0 to 255 represents the action a cell will take given its own state and that of its immediate neighbors. For example, in rule 0, every cell will turn off no matter what. In Rule 184, the “traffic rule,” the number of cells in each state always remains the same, but sends 'waves' throughout the lattice. With random starting states, rules 30, 90, 110 exhibit unpredictable, chaotic behavior. Try other rules below!
`;

export const code = `import { Environment, Terrain, CanvasRenderer, utils } from "flocc";
import { Button, Input, Panel, Radio } from "flocc-ui";

/* ----- PARAMETERS ----- */
const RULE = 30;
const PROBABILITY_OF_MUTATION = 0.0;
const RANDOMIZE = false;

const NEIGHBORHOOD = 1;
const CLASSES = 2;
/* ---------------------- */

const [width, height] = [500, 500];

/* ----- SETUP ----- */
const environment = new Environment({ width, height });
const renderer = new CanvasRenderer(environment, { width, height });
renderer.mount("#container");
const terrain = new Terrain(width, height, { grayscale: true });
environment.use(terrain);

environment.set("rule", RULE);

function p(n) {
  return (255 * (1 - n)) / (CLASSES - 1);
}

function ip(n) {
  return Math.round(1 - (n * (CLASSES - 1)) / 255);
}

function tick(x, y) {
  if (y !== environment.time + 1) return;

  const power = CLASSES ** (2 * NEIGHBORHOOD + 1);
  if (power > 100000) throw new Error("Can't handle a power that big!");

  const ruleString = environment.memo(() => {
    return utils
      .zfill(environment.get("rule").toString(CLASSES), power)
      .split("")
      .reverse()
      .join("");
  });

  const neighbors = [];

  for (let dx = -NEIGHBORHOOD; dx <= NEIGHBORHOOD; dx++) {
    neighbors.push(ip(terrain.sample(x + dx, y - 1)));
  }

  let state = neighbors.join("");
  state = parseInt(state, CLASSES);

  const value =
    utils.uniform() > PROBABILITY_OF_MUTATION
      ? +ruleString.charAt(state)
      : utils.random(0, CLASSES - 1);

  return p(value);
}

function setup() {
  terrain.init((x, y) => {
    if (y > 0) return 255;

    const value = RANDOMIZE
      ? utils.random(0, CLASSES - 1)
      : x === Math.round(width / 2)
      ? CLASSES - 1
      : 0;

    return p(value);
  });

  terrain.addRule(tick);
}

function UI() {
  new Panel(environment, [
    new Radio({
      choices: [30, 90, 110, 184],
      name: "rule",
      value: RULE
    }),
    new Input({
      name: "rule",
      value: 30
    }),
    new Button({
      label: "Reset",
      onClick() {
        cancelAnimationFrame(animationFrame);
        environment.time = 0;
        setup();
        run();
      }
    })
  ]);
}

let animationFrame = 0;

function run() {
  environment.tick();
  if (environment.time < height) animationFrame = requestAnimationFrame(run);
}

setup();
UI();
run();
`;

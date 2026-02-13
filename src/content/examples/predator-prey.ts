export const meta = {
  title: 'Predator-Prey',
  description: 'Lotka-Volterra dynamics in an agent-based model of wolves, sheep, and grass.',
  topics: ["Ecology"],
  tags: ["CanvasRenderer","LineChartRenderer"],
};

export const content = `The Predator-Prey model is an agent-based implementation of <a href="https://en.wikipedia.org/wiki/Lotka%E2%80%93Volterra_equations" target="_blank">Lotka-Volterra dynamics</a>, the classic system of differential equations describing oscillating predator and prey populations. Here, sheep (prey) graze on grass and reproduce when well-fed; wolves (predators) hunt sheep and reproduce when successful. Both species die if they fail to find food. The spatial environment adds ecological realism absent from the original equations.

The resulting population curves exhibit the characteristic boom-and-bust cycles: sheep multiply when wolves are scarce, wolves thrive on abundant prey, overpredate, and crash, allowing sheep to recover. However, unlike the deterministic Lotka-Volterra system, this agent-based model is stochastic and spatially explicit—small parameter changes can tip the ecosystem toward extinction of one or both species. This sensitivity to initial conditions and parameters makes the model a useful demonstration of <a href="https://en.wikipedia.org/wiki/Ecological_stability" target="_blank">ecological stability</a> and the fragility of predator-prey equilibria.`;

export const markup = `
  <div id="container"></div>
  <h2>
    <span style="color: blue;">Sheep</span> /
    <span style="color: red;">Wolves</span>:
  </h2>
  <div id="population"></div>`

export const code = `import { Agent, Environment, LineChartRenderer, CanvasRenderer, Terrain, Colors, utils } from "flocc";

utils.seed(1);

const SHEEP_GAIN_FROM_FOOD = 10;
const WOLF_GAIN_FROM_FOOD = 20;
const SHEEP_REPRODUCE = 0.03;
const WOLF_REPRODUCE = 0.1;
const MAX_SHEEP = 6000;

const width = 600;
const height = 300;

const sheepLocations = new Array(width * height);

const environment = new Environment({ width, height });
const renderer = new CanvasRenderer(environment, {
  background: "green",
  width,
  height
});
renderer.mount("#container");

const { GREEN } = Colors;
const terrain = new Terrain(width, height, {
  async: true
});
terrain.init(() => GREEN);
terrain.addRule((x, y) => {
  terrain.set(x, y, {
    r: GREEN.r,
    g: utils.clamp(terrain.sample(x, y).g + 1, 0, GREEN.g),
    b: GREEN.b,
    a: GREEN.a
  });
});
environment.use(terrain);

const chart = new LineChartRenderer(environment, {
  autoScale: true,
  height: 200
});
chart.metric("sheep", {
  fn: utils.sum,
  color: "blue"
});
chart.metric("wolf", {
  fn: utils.sum,
  color: "red"
});
chart.mount("#population");

function addSheep() {
  const sheep = new Agent({
    color: "white",
    size: 1.5,
    energy: utils.random(0, 2 * SHEEP_GAIN_FROM_FOOD),
    x: utils.random(0, width),
    y: utils.random(0, height),
    sheep: 1,
    tick: tickSheep
  });
  environment.increment("sheep");
  environment.addAgent(sheep);
  sheepLocations[sheep.get("x") + sheep.get("y") * width] = sheep.id;
}

function removeSheep(agent) {
  environment.removeAgent(agent);
  environment.decrement("sheep");
  sheepLocations[agent.get("x") + agent.get("y") * width] = false;
}

function addWolf() {
  environment.increment("wolves");
  environment.addAgent(
    new Agent({
      color: "#aaaaaa",
      size: 4,
      energy: utils.random(0, 2 * WOLF_GAIN_FROM_FOOD),
      x: utils.random(0, width),
      y: utils.random(0, height),
      wolf: 1,
      tick: tickWolf
    })
  );
}

function move(agent) {
  if (agent.get("sheep")) {
    const { x, y } = agent.getData();
    sheepLocations[x + y * width] = 0;
  }
  agent.increment("x", utils.random(-3, 3));
  agent.increment("y", utils.random(-3, 3));
  if (agent.get("sheep")) {
    const { x, y } = agent.getData();
    sheepLocations[x + y * width] = agent.id;
  }
}

function tickSheep(agent) {
  move(agent);
  agent.decrement("energy");
  if (agent.get("energy") < 0) removeSheep(agent);
  const { x, y } = agent.getData();
  const grass = terrain.sample(x, y).g;
  if (grass > 0) {
    const amountToEat = Math.min(SHEEP_GAIN_FROM_FOOD, grass);
    agent.increment("energy", amountToEat);
    [-1, 0, 1].forEach((_y) => {
      [-1, 0, 1].forEach((_x) => {
        const { r, g, b, a } = terrain.sample(x + _x, y + _y);
        terrain.set(x + _x, y + _y, r, g - 15, b, a);
      });
    });
    terrain.set(x, y, grass - 8 * amountToEat);
  }
  // reproduce
  if (utils.uniform() < SHEEP_REPRODUCE) {
    agent.set("energy", agent.get("energy") / 2);
    addSheep();
  }
}

function tickWolf(agent) {
  move(agent);
  agent.decrement("energy");
  if (agent.get("energy") < 0) {
    environment.removeAgent(agent);
    environment.decrement("wolves");
  }
  const here = [];
  const r = 6;
  for (let y = agent.get("y") - r; y < agent.get("y") + r; y++) {
    for (let x = agent.get("x") - r; x < agent.get("x") + r; x++) {
      const index =
        (x < 0 ? x + width : x >= width ? x - width : x) +
        (x < 0 ? y + height : y >= height ? y - height : y) * width;
      const sheep = sheepLocations[index];
      if (sheep) here.push(sheep);
    }
  }
  if (here.length === 0) return;
  removeSheep(environment.getAgentById(utils.sample(here)));
  agent.increment("energy", WOLF_GAIN_FROM_FOOD);
  // reproduce
  if (utils.uniform() < WOLF_REPRODUCE) {
    agent.set("energy", agent.get("energy") / 2);
    addWolf();
  }
}

function setup() {
  for (let i = 0; i < 300; i++) addSheep();
  for (let i = 0; i < 100; i++) addWolf();
}

function run() {
  environment.tick();
  if (environment.get("sheep") >= MAX_SHEEP) {
    window.alert("The sheep have inherited the earth!");
  } else if (environment.time < 3000) {
    requestAnimationFrame(run);
  }
}

setup();
run();
`;

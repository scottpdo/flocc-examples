export const meta = {
  title: 'Traffic',
  description: 'Lorem ipsum',
  topics: [],
  tags: ["CanvasRenderer"],
};

export const content = `If you've ever been on a freeway at rush hour, you know the stop-and-start nature of heavy traffic. In this model, an agent with an empty 'road' in front of it will attempt to accelerate until it gets close to another agent, at which point it decelerates (i.e. slamming on the brakes). Watch how this behavior sends 'waves' backwards to the agents behind it, causing 'traffic jams.' Under the right conditions, agents are able to separate such that traffic becomes smooth, but other environments are plagued by disruptive, halting motion.
`;

export const markup = `
<div id="container"></div>
<h2>Speed</h2>
<div id="histogram"></div>`;

export const code = `import { Agent, Environment, CanvasRenderer, utils, Histogram } from "flocc";
utils.seed(1);

/* ------- PARAMETERS --------- */

const NUM_CARS = 32;
const ACCELERATION = 1.1;
const MAX_SPEED = 18;
const MIN_SPEED = 0.5;
const width = window.innerWidth;
const height = 200;

/* ---------------------------- */

const environment = new Environment();
const container = document.getElementById("container");
const renderer = new CanvasRenderer(environment, {
  background: "#eeeeee",
  width,
  height
});
renderer.mount(container);

const histogram = new Histogram(environment, {
  buckets: 3,
  width,
  height,
  max: MAX_SPEED / 10
});
histogram.metric("vx");
histogram.mount("#histogram");

function setup() {
  for (var i = 0; i < NUM_CARS; i++) {
    const agent = new Agent({
      x: utils.uniform() * width,
      y: height / 2,
      vx: 0.5 + utils.uniform(),
      vy: 0,
      size: 2.5,
      shape: "arrow"
    });

    agent.addRule(tick);

    environment.addAgent(agent);
  }
}

function tick(agent) {
  let { x, vx } = agent.getData();

  let isAhead = environment.getAgents().some((neighbor) => {
    const nx = neighbor.get("x");
    // if within 5 of velocity
    if (Math.abs(nx - x) < 5 * vx) {
      // must be ahead, not behind
      if (nx > x || (x + 5 * vx > width && nx - 5 * vx < 0)) return true;
    }
    return false;
  });

  x += vx;
  while (x < 0) x += width;
  while (x >= width) x -= width;

  vx *= isAhead ? 0 : ACCELERATION;
  vx = utils.clamp(vx, Math.max(MIN_SPEED / 10, 0.01), MAX_SPEED / 10);

  return { x, vx };
}

function run() {
  environment.tick({ randomizeOrder: true });
  requestAnimationFrame(run);
}

setup();
run();
`;

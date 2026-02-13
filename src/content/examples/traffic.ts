export const meta = {
  title: 'Traffic',
  description: 'A car-following model demonstrating how phantom traffic jams emerge from local braking.',
  topics: ["Physics", "Social Science"],
  tags: ["CanvasRenderer"],
};

export const content = `This model illustrates a counterintuitive phenomenon familiar to anyone who has experienced rush-hour traffic: jams that appear to arise from nothing. Based on <a href="https://en.wikipedia.org/wiki/Traffic_flow#Car-following_models" target="_blank">car-following models</a> in traffic flow theory, each agent (car) accelerates when the road ahead is clear and brakes when approaching another vehicle. These simple local rules produce emergent <a href="https://en.wikipedia.org/wiki/Traffic_wave" target="_blank">traffic waves</a>—backward-propagating pulses of congestion.

When one agent brakes, the agent behind must brake harder (due to reaction time), and so on down the line—a cascade that amplifies small perturbations into stop-and-go waves. The phenomenon is a striking example of how global patterns can emerge without any global cause: no accident, no bottleneck, just the aggregate effect of many drivers following simple rules. Under certain density and parameter regimes, the system reaches a smooth flow; under others, it remains locked in perpetual oscillation.
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

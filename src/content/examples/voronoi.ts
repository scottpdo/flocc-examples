export const meta = {
  title: 'Emergent Voronoi',
  description: 'An agent-based approach to constructing Voronoi diagrams through emergent boundary detection.',
  topics: ["Mathematics", "Physics"],
  tags: ["CanvasRenderer"],
};

export const content = `A <a href="https://en.wikipedia.org/wiki/Voronoi_diagram" target="_blank">Voronoi diagram</a> partitions a plane into regions, where each region contains all points closer to one "seed" point than to any other. Voronoi diagrams appear throughout nature and science—from the territories of competing species to the structure of foams and crystals.

Rather than computing the diagram analytically, this model derives it through emergent agent behavior. Seed points are scattered randomly across the plane; then many more agents with random velocities begin moving. Each agent stops when it reaches a position equidistant from the two nearest seeds—that is, on the boundary between two Voronoi cells. The accumulation of stationary agents traces out the diagram's edges. This approach illustrates how global geometric structures can emerge from local distance-seeking behavior, without any agent having knowledge of the diagram as a whole.
`;

export const code = `import { Agent, Environment, CanvasRenderer, utils } from "flocc";

const NUM_PTS = 40;
const NUM_AGENTS = 1000;
const width = window.innerWidth;
const height = window.innerHeight;

const environment = new Environment();
const container = document.getElementById("container");

const renderer = new CanvasRenderer(environment, { width, height });
renderer.mount(container);

const pts = [];

function setup() {
  while (pts.length < NUM_PTS) {
    const pt = new Agent({
      x: utils.random(0, width),
      y: utils.random(0, height)
    });
    pts.push(pt);
  }

  for (let i = 0; i < NUM_AGENTS; i++) {
    const agent = new Agent({
      x: utils.random(0, width),
      y: utils.random(0, height),
      dir: Math.random() * 2 * Math.PI,
      size: Math.abs(utils.gaussian(2, 1)) + 0.75
    });
    agent.addRule(tick);
    environment.addAgent(agent);
  }
}

function tick(agent) {
  let pt1 = null,
    pt2 = null;
  let d1 = Infinity,
    d2 = Infinity;

  pts.forEach(pt => {
    const d = utils.distance(agent, pt);
    if (d < d1) {
      if (pt1 !== null) {
        pt2 = pt1;
        d2 = d1;
      }
      pt1 = pt;
      d1 = d;
    }
  });

  if (Math.abs(d1 - d2) < 1.5) return;

  const { x, y, dir } = agent.getData();
  return {
    x: x + 0.7 * Math.cos(dir),
    y: y + 0.7 * Math.sin(dir)
  };
}

function render() {
  environment.tick();
  requestAnimationFrame(render);
}

setup();
render();
`;

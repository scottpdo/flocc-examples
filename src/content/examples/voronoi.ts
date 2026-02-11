export const meta = {
  title: 'Emergent Voronoi',
  description: 'Lorem ipsum',
  topics: [],
  tags: ["CanvasRenderer"],
};

export const content = `A Voronoi diagram divides a plane into a set of non-overlapping regions, where each region is the set of points closest to a given point in that region.

One method of deriving a Voronoi diagram from a set of points on a plane is through the emergent movement of (many more) random vectors on the plane. In this example, 25 random points are placed on the plane to divide it into regions. Then, 1,000 random vectors (points with a random directional velocity) are placed and begin moving until they are the same distance from the two nearest points. Then, they stop. The resulting accumulation of stationary vectors describes the boundaries of the Voronoi diagram.
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

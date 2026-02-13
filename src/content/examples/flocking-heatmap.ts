export const meta = {
  title: 'Flocking (Heatmap)',
  description: 'Boids flocking visualized as a density heatmap, revealing emergent group-level patterns.',
  topics: ["Ecology"],
  tags: ["Heatmap","KDTree"],
};

export const content = `This model applies <a href="https://www.red3d.com/cwr/boids/" target="_blank">Reynolds' boids algorithm</a> but shifts the visualization from individual agents to their aggregate spatial distribution. Using a <code>Heatmap</code> renderer, regions of high agent density appear as bright cells, while sparse regions remain dark. The result foregrounds <em>group-level</em> behavior over individual trajectories.

What emerges is reminiscent of cellular automata: flocks materialize as glowing clusters that drift, merge, and fragment across the grid. This perspective illustrates a key insight from complexity science—that the same underlying dynamics can appear qualitatively different depending on the level of description. Where the standard flocking visualization emphasizes individual agents and their local interactions, the heatmap reveals the macroscopic patterns those interactions produce.`;

export const code = `import { Agent, Environment, Heatmap, KDTree, Vector, utils } from "flocc";

/* ------- PARAMETERS --------- */

const ALIGNMENT = 1;
const SEPARATION = 1;
const COHESION = 1;
const VISION = 15;
const MAX_SPEED = 3;
const MAX_FORCE = 0.15;
const FLOCK_SIZE = 320;
const [width, height] = [window.innerWidth, window.innerHeight];

/* ---------------------------- */

/* ------- SET UP ENVIRONMENT, RENDERER --------- */

utils.seed(1);

const environment = new Environment({ width, height });
const renderer = new Heatmap(environment, {
  x: {
    key: "x",
    max: width,
    buckets: 20
  },
  y: {
    key: "y",
    max: height,
    buckets: 20
  },
  from: "darkblue",
  to: "yellow",
  width,
  height
});
renderer.mount("#container");

let tree;

function setup() {
  for (let i = 0; i < FLOCK_SIZE; i++) {
    const agent = new Agent();

    agent.set("x", utils.random(0, width));
    agent.set("y", utils.random(0, height));

    const angle = 2 * Math.random() * Math.PI;

    agent.set("shape", "arrow");
    agent.set("size", 2.5);

    agent.set("vx", Math.cos(angle));
    agent.set("vy", Math.sin(angle));

    agent.addRule(tick);

    environment.addAgent(agent);
  }

  tree = new KDTree(environment.getAgents(), 2);
  environment.use(tree);
}

function tick(agent) {
  const { x, y, vx, vy } = agent.getData();

  const pos = new Vector(x, y);
  const vel = new Vector(vx, vy);
  const acc = new Vector(0, 0);

  const ip = pos.clone().multiplyScalar(-1);
  const iv = vel.clone().multiplyScalar(-1);

  const alignment = new Vector(0, 0);
  const cohesion = new Vector(0, 0);
  const separation = new Vector(0, 0);

  const neighbors = tree.agentsWithinDistance(agent, VISION);
  neighbors.forEach((a) => {
    let ax = a.get("x");
    let ay = a.get("y");
    let avx = a.get("vx");
    let avy = a.get("vy");

    alignment.x += avx;
    alignment.y += avy;
    cohesion.x += ax;
    cohesion.y += ay;

    const diff = pos
      .clone()
      .add(new Vector(-ax, -ay))
      .multiplyScalar(1 / Math.max(utils.distance(agent, a), 0.0001));
    separation.add(diff);
  });

  if (neighbors.length > 0) {
    const n = neighbors.length;
    alignment.multiplyScalar(1 / n);
    alignment.normalize().multiplyScalar(MAX_SPEED).add(iv);
    if (alignment.length() > MAX_FORCE)
      alignment.normalize().multiplyScalar(MAX_FORCE);

    cohesion.multiplyScalar(1 / n);
    cohesion.add(ip);
    cohesion.normalize().multiplyScalar(MAX_SPEED);
    cohesion.add(iv);
    if (cohesion.length() > MAX_FORCE)
      cohesion.normalize().multiplyScalar(MAX_FORCE);

    separation.multiplyScalar(1 / n);
    separation.normalize().multiplyScalar(MAX_SPEED);
    separation.add(iv);
    if (separation.length() > MAX_FORCE)
      separation.normalize().multiplyScalar(MAX_FORCE);
  }

  alignment.multiplyScalar(ALIGNMENT);
  cohesion.multiplyScalar(COHESION);
  separation.multiplyScalar(SEPARATION);

  acc.add(alignment);
  acc.add(cohesion);
  acc.add(separation);

  pos.add(vel);
  vel.add(acc);
  if (vel.length() > MAX_SPEED) vel.normalize().multiplyScalar(MAX_SPEED);

  return {
    x: pos.x,
    y: pos.y,
    vx: vel.x,
    vy: vel.y
  };
}

function run() {
  environment.tick({ randomizeOrder: true });
  requestAnimationFrame(run);
}

setup();
run();
`;

export const meta = {
  title: 'Flocking',
  description: 'The classic boids algorithm, demonstrating emergent flocking behavior from three simple rules: alignment, cohesion, and separation.',
};

export const content = `
## About

Flocking is one of the most iconic examples of emergent behavior in complex systems. First described by Craig Reynolds in 1986, the "boids" algorithm shows how realistic flocking patterns emerge from agents following just three simple rules:

1. **Alignment**: Steer towards the average heading of nearby flockmates
2. **Cohesion**: Steer towards the center of mass of nearby flockmates  
3. **Separation**: Avoid crowding nearby flockmates

Each agent has a perception radius within which it considers its neighbors. The balance of these three forces creates the characteristic swirling, organic motion of flocks.

## Try It

Edit the code below to experiment:
- Change \`SPEED\` to make boids faster or slower
- Adjust \`PERCEPTION\` to change how far boids can see
- Modify \`SEPARATION\` to control personal space
- Try changing the number of boids
`;

export const code = `import { Agent, Environment, CanvasRenderer, KDTree, Vector, utils } from "flocc";

/* ------- PARAMETERS --------- */

const ALIGNMENT = 1;
const SEPARATION = 1;
const COHESION = 1;
const VISION = 15;
const MAX_SPEED = 3;
const MAX_FORCE = 0.15;
const FLOCK_SIZE = 320;
const [width, height] = [window.innerWidth, window.innerHeight];

/* ------- SET UP ENVIRONMENT, RENDERER --------- */

const environment = new Environment({ width, height });
const renderer = new CanvasRenderer(environment, {
  width,
  height
});
const container = document.getElementById("container");
renderer.mount(container);

let tree;

function setup() {
  for (let i = 0; i < FLOCK_SIZE; i++) {
    const angle = 2 * Math.random() * Math.PI;
    const agent = new Agent({
      x: utils.random(0, width),
      y: utils.random(0, height),
      vx: Math.cos(angle),
      vy: Math.sin(angle),
      shape: 'arrow',
      size: 2.5,
      tick
    });

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
  neighbors.forEach(a => {
    const { x: ax, y: ay, vx: avx, vy: avy } = a.getData();

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
    alignment
      .normalize()
      .multiplyScalar(MAX_SPEED)
      .add(iv);
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

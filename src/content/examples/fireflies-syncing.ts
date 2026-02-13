export const meta = {
  title: 'Fireflies Syncing',
  description: 'Pulse-coupled oscillators synchronizing through local interactions, inspired by Thai fireflies.',
  topics: ["Ecology", "Physics"],
  tags: ["CanvasRenderer","KDTree"],
};

export const content = `This model demonstrates <a href="https://en.wikipedia.org/wiki/Synchronization" target="_blank">spontaneous synchronization</a>, a phenomenon observed in Thai fireflies, heart pacemaker cells, and many other biological and physical systems. Each firefly agent has an internal oscillator (a "clock") that triggers a flash when it completes a cycle. When a firefly sees a neighbor flash, it nudges its own clock forward slightly—a mechanism called <a href="https://en.wikipedia.org/wiki/Pulse-coupled_oscillator" target="_blank">pulse coupling</a>.

Initially, flashes are scattered randomly across the population. But through repeated local interactions, the fireflies gradually align their phases until, remarkably, the entire swarm flashes in unison—without any central coordinator or global signal. This is a canonical example of <em>emergent order</em>: global coherence arising from purely local rules. The implementation draws on Nicky Case's interactive explorable <a href="https://ncase.me/fireflies/" target="_blank">"Fireflies"</a>, and the underlying mathematics are beautifully described in Steven Strogatz's <a href="https://www.stevenstrogatz.com/books/sync-the-emerging-science-of-spontaneous-order" target="_blank"><i>Sync: How Order Emerges from Chaos in the Universe, Nature, and Daily Life</i></a>.`;

export const code = `import { Agent, Environment, CanvasRenderer, Vector, KDTree, utils } from "flocc";

const POPULATION = 250;

const width = window.innerWidth;
const height = window.innerHeight;

const environment = new Environment({
  width,
  height
});
let tree;

const renderer = new CanvasRenderer(environment, {
  background: "#112",
  width,
  height
});
renderer.mount("#container");

function tick(agent) {
  // update position
  agent.increment("x", agent.get("velocity").x);
  agent.increment("y", agent.get("velocity").y);

  if (utils.uniform() < 0.05) {
    agent.get("velocity").rotateZ(0.25 * (utils.uniform() - 0.5));
  }

  // update clock and alpha
  agent.set("alpha", Math.max(agent.get("alpha") * 0.9, 0.05));
  agent.increment("clock", 0.005);

  if (agent.get("clock") > 1) flash(agent);
}

function flash(agent) {
  agent.set({
    alpha: 1,
    clock: 0
  });
  const neighbors = tree.agentsWithinDistance(
    agent,
    Math.min(window.innerWidth, window.innerHeight) * 0.2
  );
  neighbors.forEach(neighbor => {
    const { clock } = neighbor.getData();
    neighbor.increment("clock", clock * 0.03);
    if (neighbor.get("clock") > 1) neighbor.set("clock", 1);
  });
}

function setup() {
  for (let i = 0; i < POPULATION; i++) {
    const agent = new Agent({
      alpha: 0.1,
      clock: utils.uniform(),
      color: a => \`rgba(255, 255, 255, \${a.get("alpha")})\`,
      size: 3,
      velocity: new Vector(utils.uniform() * 2 - 1, utils.uniform() * 2 - 1),
      x: utils.random(0, width),
      y: utils.random(0, height)
    });
    agent.get("velocity").normalize();
    agent.addRule(tick);
    environment.addAgent(agent);
  }

  tree = new KDTree(environment.getAgents(), 2);
  environment.use(tree);
}

function run() {
  environment.tick();
  requestAnimationFrame(run);
}

setup();
run();
`;

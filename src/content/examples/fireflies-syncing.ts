export const meta = {
  title: 'Fireflies Syncing',
  description: 'Lorem ipsum',
  topics: ["Ecology"],
  tags: ["CanvasRenderer","KDTree"],
};

export const content = `This model, based on observations of fireflies in Thailand, shows how a system of distributed entities with periodic behavior can eventually become nearly perfectly in sync. Each 'firefly' agent has an internal clock, and when it flashes, nearby fireflies accelerate their clocks forward slightly. As the fireflies randomly navigate the environment, they encounter more and more flashing fireflies and grow more in sync with them. After a relatively short amount of time, all the fireflies are flashing in unison, with no top-down or centralized behavior organizing them. Like in the flocking model, this behavior emerges out of the interactions of many individual agents.

The implementation of this model is indebted to Nicky Case's interactive explorable <a href="https://ncase.me/fireflies/" target="_blank">“Fireflies”</a>, and the phenomenon is described in the opening chapter of Steven Strogatz's book <a href="https://www.stevenstrogatz.com/books/sync-the-emerging-science-of-spontaneous-order" target="_blank"><i>Sync: How Order Emerges from Chaos in the Universe, Nature, and Daily Life.</i></a>`;

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

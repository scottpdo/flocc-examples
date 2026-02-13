export const meta = {
  title: 'Network Diffusion',
  description: 'Diffusion dynamics on a small-world network, where quantities spread from high to low until equilibrium.',
  topics: ["Network Science"],
  tags: ["Network"],
};

export const content = `This model demonstrates <a href="https://en.wikipedia.org/wiki/Diffusion" target="_blank">diffusion</a> on a network—the process by which a quantity (here represented abstractly as agent "size") spreads from areas of high concentration to low. Agents are connected in a <a href="https://en.wikipedia.org/wiki/Small-world_network" target="_blank">small-world network</a>: mostly local geographic neighbors, with a probability of random long-range connections controlled by <code>REWIRING_PROBABILITY</code>. Each tick, agents transfer a portion of their size to smaller neighbors.

Over time, the network tends toward equilibrium—the standard deviation of sizes decreases as the distribution converges to the mean. The small-world topology accelerates this convergence: long-range shortcuts allow diffusion to bridge distant clusters rapidly. This abstract model captures dynamics relevant to heat transfer, information spread, wealth redistribution, and other processes where local interactions drive global homogenization.`;

export const code = `import { Agent, Environment, CanvasRenderer, utils, Network, LineChartRenderer } from "flocc";

/* ----- PARAMETERS ----- */
const POPULATION = 60;
const REWIRING_PROBABILITY = 0.2;
const TRANSFER = 0.02;

/* ----- SETUP ----- */
const environment = new Environment();
const network = new Network();
environment.use(network);

const renderer = new CanvasRenderer(environment, {
  autoPosition: true,
  width: 400,
  height: 400
});
renderer.mount("#container");
const chart = new LineChartRenderer(environment, {
  autoScale: true,
  background: "#eee",
  width: 300,
  height: 300,
  range: { min: -0.25, max: 1 }
});
chart.mount("#chart");

function tick(agent) {
  const neighbors = network.neighbors(agent);
  neighbors.forEach(neighbor => {
    if (neighbor.get("size") + TRANSFER < agent.get("size")) {
      agent.decrement("size", TRANSFER);
      neighbor.increment("size", TRANSFER);
    }
  });
}

function setup() {
  for (let i = 0; i < POPULATION; i++) {
    const agent = new Agent();
    agent.set("size", Math.max(utils.gaussian(7, 6), 1));
    agent.addRule(tick);
    environment.addAgent(agent);
    network.addAgent(agent);
  }

  for (let i = 0; i < POPULATION; i++) {
    for (let j = i - 2; j < i + 2; j++) {
      network.connect(network.get(i), network.get(j));
    }
  }

  network.agents.forEach((agent, i) => {
    network.neighbors(agent).forEach(neighbor => {
      if (Math.random() < REWIRING_PROBABILITY) {
        network.disconnect(agent, neighbor);

        const j = Math.floor(Math.random() * POPULATION);
        network.connect(agent, network.get(j));
      }
    });
  });

  chart.metric("size", {
    fn: utils.stdDev
  });

  chart.metric("size", {
    color: "blue",
    fn: utils.max
  });

  chart.metric("size", {
    color: "red",
    fn: utils.min
  });
}

function draw() {
  environment.tick();
  requestAnimationFrame(draw);
}

setup();
draw();
`;

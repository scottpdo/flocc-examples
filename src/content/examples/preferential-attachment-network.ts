export const meta = {
  title: 'Preferential Attachment Network',
  description: 'Lorem ipsum',
  topics: [],
  tags: ["Network"],
};

export const content = `In network science, a preferential attachment network is a type of network structure where just a few nodes have a large number of connections to others, while most nodes have a small number of connections. This results in highly unbalanced networks with large disparities of degree, although degree is predictable based on the size of the network and the number of connections used in generating it. An example of a preferential attachment network is Twitter, where a few accounts have huge number of followers, where most accounts have relatively few.

This model shows how to generate a preferential attachment network from a target size and degree for new nodes. When agents are added to the network, they connect to a certain number of other agents based on how many connections existing agents in the network have. This results in those that were added earliest having the highest number of connections, on average.
`;

export const markup = `
  <div id="container"></div>
  <h4>Mean degree:</h4>
  <div id="degree"></div>`;

export const code = `import {
  Agent,
  Environment,
  CanvasRenderer,
  utils,
  Network,
  LineChartRenderer
} from "flocc";

const SIZE = 250;
const DEGREE = 3;

const environment = new Environment();
const network = new Network();
environment.use(network);

environment.set("size", SIZE);
environment.set("degree", DEGREE);

const renderer = new CanvasRenderer(environment, {
  autoPosition: true,
  connectionOpacity: 0.25,
  width: 0.9 * Math.min(window.innerWidth, window.innerHeight),
  height: 0.9 * Math.min(window.innerWidth, window.innerHeight)
});
renderer.mount("#container");

const chart = new LineChartRenderer(environment, {
  width: 300,
  height: 200,
  range: {
    min: 0,
    max: DEGREE * 3
  }
});
chart.mount("#degree");
chart.metric("degree", {
  fn: utils.mean
});

const x = (agent) => {
  const idx = network.indexOf(agent);
  const angle = idx / network.agents.length;
  return (
    renderer.width / 2 + 0.4 * renderer.width * Math.cos(2 * Math.PI * angle)
  );
};

const y = (agent) => {
  const idx = network.indexOf(agent);
  const angle = idx / network.agents.length;
  return (
    renderer.width / 2 + 0.4 * renderer.width * Math.sin(2 * Math.PI * angle)
  );
};

const degree = (agent) => {
  return network.neighbors(agent).length;
};

const agentSize = (agent) => {
  const neighbors = network.neighbors(agent).length;
  return (
    neighbors * Math.ceil(Math.min(window.innerWidth, window.innerHeight) / 600)
  );
};

const color = "rgba(0, 0, 0, 0.6)";

function addToNetwork() {
  const sample = utils.sampler(DEGREE);
  // add to network
  const agent = new Agent({
    size: agentSize,
    x,
    y,
    color,
    degree
  });
  environment.addAgent(agent);
  const neighbors = sample(
    network.agents,
    network.agents.map((n) => network.neighbors(n).length)
  );
  network.addAgent(agent);
  neighbors.forEach((n) => {
    network.connect(agent, n);
  });
}

function setup() {
  for (let i = 0; i < environment.get("degree") + 1; i++) {
    const agent = new Agent({
      size: agentSize,
      degree,
      x,
      y,
      color
    });
    environment.addAgent(agent);

    if (i < DEGREE) {
      network.addAgent(agent);
    } else if (i === DEGREE) {
      network.addAgent(agent);
      network.agents.forEach((n) => {
        network.connect(agent, n);
      });
    }
  }
}

function run() {
  environment.tick();
  if (environment.getAgents().length < environment.get("size")) addToNetwork();
  setTimeout(run, 60);
}

setup();
run();
`;

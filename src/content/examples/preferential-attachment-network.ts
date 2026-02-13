export const meta = {
  title: 'Preferential Attachment Network',
  description: 'The Barabási-Albert model: "rich get richer" dynamics producing scale-free networks.',
  topics: ["Network Science"],
  tags: ["Network"],
};

export const content = `<a href="https://en.wikipedia.org/wiki/Preferential_attachment" target="_blank">Preferential attachment</a>, formalized by <a href="https://en.wikipedia.org/wiki/Barab%C3%A1si%E2%80%93Albert_model" target="_blank">Barabási and Albert in 1999</a>, is a generative mechanism for <a href="https://en.wikipedia.org/wiki/Scale-free_network" target="_blank">scale-free networks</a>—networks where a few "hub" nodes have vastly more connections than most others. The rule is simple: when a new node joins the network, it preferentially connects to nodes that already have many connections. This "rich get richer" dynamic amplifies early advantages, producing the heavy-tailed degree distributions observed in many real-world networks.

Examples abound: on X (formerly Twitter), a small number of accounts have millions of followers while most have few; on the web, a handful of sites attract the vast majority of links; in citation networks, a few papers accumulate enormous citation counts. This model visualizes the growth process: nodes arrive sequentially, each connecting to existing nodes with probability proportional to their current degree. The result is a highly unequal but predictable structure, where the oldest nodes tend to become the largest hubs.
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
  // sample neighbors BEFORE creating agent (using existing network state)
  const neighbors = sample(
    network.agents,
    network.agents.map((n) => network.neighbors(n).length)
  );
  // create and add to network first, so x/y can find the agent
  const agent = new Agent({
    size: agentSize,
    x,
    y,
    color,
    degree
  });
  network.addAgent(agent);
  neighbors.forEach((n) => {
    network.connect(agent, n);
  });
  // add to environment last (triggers rendering)
  environment.addAgent(agent);
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
    // add to network first, so x/y can find the agent
    network.addAgent(agent);
    if (i === DEGREE) {
      network.agents.forEach((n) => {
        if (n !== agent) network.connect(agent, n);
      });
    }
    // add to environment last (triggers rendering)
    environment.addAgent(agent);
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

export const meta = {
  title: 'The Emperor\'s Dilemma',
  description: 'How unpopular norms spread through enforcement rather than belief, creating pluralistic ignorance.',
  topics: ["Social Science"],
  tags: ["CanvasRenderer","Flocc UI","Network"],
};

export const content = `<a href="https://ndg.asc.upenn.edu/wp-content/uploads/2016/04/Centola-et-al-2005-AJS.pdf" target="_blank">The Emperor's Dilemma</a> (Centola, Willer & Macy, 2005) models how norms can dominate a population despite being privately unpopular—a phenomenon known as <a href="https://en.wikipedia.org/wiki/Pluralistic_ignorance" target="_blank">pluralistic ignorance</a>. The key mechanism is enforcement: a small minority of "true believers" (yellow) actively punish non-compliance, making it costly for skeptics to stay silent. Non-believers, seeing enforcement around them, comply and enforce the norm themselves (red), propagating it further—even though few genuinely support it.

Agents are embedded in a <a href="https://en.wikipedia.org/wiki/Small-world_network" target="_blank">small-world network</a>: mostly local connections with occasional long-range ties. This topology accelerates norm spread by allowing enforcement to cascade quickly across distant clusters. The model captures dynamics observed in phenomena from the <a href="https://en.wikipedia.org/wiki/Salem_witch_trials" target="_blank">Salem witch trials</a> to authoritarian compliance: systems where outward conformity masks private dissent. By adjusting the cost of non-compliance, the proportion of true believers, and individual conviction strength, the simulation can produce rapid takeover, slow spread, or stalled diffusion—illuminating the fragile conditions under which unpopular norms persist or collapse.
`;

export const code = `import {
  Environment,
  CanvasRenderer,
  Network,
  KDTree,
  utils,
  Agent
} from "flocc";
import { Panel, Slider, Button } from "flocc-ui";

utils.seed(1);

const [width, height] = [window.innerWidth - 50, window.innerHeight - 50];
const COST = 0.08;
const REWIRE = 0.03;
const BELIEVERS = 0.015;
const NONBELIEVER_STRENGTH_MAX = 0.38;
const NEIGHBORS = 8;
const POPULATION = 500;

// R = compliance   {-1, 1} => {  0, 255}
// G = belief       {-1, 1} => {  0, 255}
// B = strength     [ 0, NONBELIEVER_STRENGTH_MAX] => [  0, 255]
// A = enforcement  {-1, 1} => {127, 255}

const encodeComplianceOrBelief = (n) => utils.remap(n, -1, 1, 0, 255);
const encodeStrength = (n) =>
  utils.remap(n, 0, environment.get("strength"), 0, 255);
const encodeEnforcement = (n) => utils.remap(n, -1, 1, 127, 255);

const color = (agent) => {
  const { compliance, belief, strength, enforcement } = agent.getData();
  return belief === 1
    ? "yellow"
    : \`rgba(
    \${encodeComplianceOrBelief(compliance)},
    \${encodeComplianceOrBelief(belief)},
    \${encodeStrength(strength)},
    \${encodeEnforcement(enforcement)}
  )\`;
};

const environment = new Environment({ width, height, torus: false });
const renderer = new CanvasRenderer(environment, {
  background: "#ddd",
  connectionOpacity: 0.15,
  width,
  height
});
renderer.mount("#container");

const network = new Network();
environment.use(network);

let tree;

environment.set("cost", COST);
environment.set("believers", BELIEVERS);
environment.set("strength", NONBELIEVER_STRENGTH_MAX);
environment.set("rewire", REWIRE);

function tick(agent) {
  let { compliance, belief, strength, enforcement } = agent.getData();

  const neighbors = network.neighbors(agent);
  const numNeighbors = neighbors.length;

  const enforcementByNeighbors = neighbors.map((p) => p.get("enforcement"));
  const complianceByNeighbors = neighbors.map((p) => p.get("compliance"));

  const sumOfEnforcementByNeighbors = utils.sum(enforcementByNeighbors);
  const sumOfComplianceByNeighbors = utils.sum(complianceByNeighbors);

  if ((-belief / numNeighbors) * sumOfEnforcementByNeighbors > strength) {
    compliance = -belief;
  } else {
    compliance = belief;
  }

  if (belief !== compliance) {
    if (
      (-belief / numNeighbors) * sumOfEnforcementByNeighbors >
      strength + environment.get("cost")
    ) {
      enforcement = -belief;
    }
  } else if (belief === compliance) {
    const needForEnforcement =
      (1 - (belief / numNeighbors) * sumOfComplianceByNeighbors) / 2;
    if (strength * needForEnforcement > environment.get("cost")) {
      enforcement = belief;
    } else {
      enforcement = 0;
    }
  }

  return { compliance, belief, strength, enforcement };
}

function setup() {
  // set up initial population of agents
  for (let i = 0; i < POPULATION; i++) {
    let data;
    if (utils.uniform() <= environment.get("believers")) {
      data = {
        compliance: 1,
        belief: 1,
        strength: 1,
        enforcement: 0
      };
    } else {
      data = {
        compliance: -1,
        belief: -1,
        strength: utils.random(0, environment.get("strength"), true),
        enforcement: 0
      };
    }
    const agent = new Agent(
      Object.assign(data, {
        color,
        size: 4,
        x: utils.random(25, width - 25),
        y: utils.random(25, height - 25)
      })
    );
    agent.addRule(tick);
    environment.addAgent(agent);
    network.addAgent(agent);
  }

  tree = new KDTree(environment.getAgents());

  environment.getAgents().forEach((agent) => {
    if (network.neighbors(agent).length > NEIGHBORS) return;
    let distance = 5;
    while (network.neighbors(agent).length < NEIGHBORS) {
      const neighbors = tree.agentsWithinDistance(agent, distance);
      neighbors.forEach((neighbor) => network.connect(agent, neighbor));
      distance++;
    }
  });

  // rewire
  environment.getAgents().forEach((agent) => {
    if (utils.uniform() < environment.get("rewire")) {
      const toDisconnect = utils.sample(network.neighbors(agent));
      network.disconnect(agent, toDisconnect);

      const toConnect = utils.sample(environment.getAgents());
      network.connect(agent, toConnect);
    }
  });
}

function reset() {
  network.clear();
  tree.agents = [];
  while (environment.getAgents().length > 0) {
    environment.removeAgent(environment.getAgents()[0]);
  }
}

function UI() {
  new Panel(environment, [
    new Slider({
      name: "cost",
      min: 0,
      max: 0.5,
      step: 0.001
    }),
    new Slider({
      name: "believers",
      max: 0.1,
      step: 0.001
    }),
    new Slider({
      name: "strength",
      min: 0,
      max: 1,
      step: 0.01
    }),
    new Slider({
      name: "rewire",
      min: 0,
      max: 1,
      step: 0.01
    }),
    new Button({
      label: "Reset",
      onClick() {
        reset();
        setup();
      }
    })
  ]);
}

function run() {
  environment.tick();
  requestAnimationFrame(run);
}

setup();
UI();
run();
`;

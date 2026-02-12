export const meta = {
  title: 'The Emperor\'s Dilemma',
  description: 'Lorem ipsum',
  topics: ["Social Science"],
  tags: ["CanvasRenderer","Flocc UI","Network"],
};

export const content = `<a href="https://ndg.asc.upenn.edu/wp-content/uploads/2016/04/Centola-et-al-2005-AJS.pdf" target="_blank">The Emperor's Dilemma</a> (Centola, Willer & Macy, 2005) models how norms spread among populations despite low popularity. Similar to the <a href="https://en.wikipedia.org/wiki/Salem_witch_trials" target="_blank">Salem witch trials</a> of the 17th century, the phenomenon is caused “not by an outbreak of deviance, but of enforcement.” A few agents who are 'true believers' in the norm make it costly for nonbelievers to not take a stance — despite their indifference or even opposition, they become enforcers of the norm and cause it to spread across the population. This results in an environment where few actually believe in the dominant norm, but nearly all enforce it.

In this simulation, agents are connected in a small world network (most agents connected to those close to them, with a few 'random' connections to far-flung others). Red agents represent those complying with the norm, and the few yellow agents are those 'true believers' who always enforce the norm. Agents who do not believe in the norm will comply and enforce it if they see enough of their neighbors enforcing it. By adjusting the <code>cost</code>, percentage of <code>believers</code>, <code>strength</code> (maximum conviction against the norm), and <code>rewire</code> parameters, the spread of the norm will take different trajectories. What dynamics lead to it spreading more quickly, slowing, or halting?
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

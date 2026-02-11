export const meta = {
  title: 'Edge Weight Adaptation in Response to Contagion',
  description: 'Lorem ipsum',
  topics: ["Complex Systems","Epidemiology"],
  tags: ["LineChart","Network"],
};

export const content = `In this model, designed and presented at the Complex Networks Winter Workshop 2021 by Herzog, Johnson, Stone, Gao, & Donaldson, a contagion is released on a network. Agents who are infected might infect others, but they might also self-isolate, reducing their likelihood of infecting others to 0. If enough agents become infected, a global 'lockdown' is imposed, and all agents may choose to self-isolate (with a higher likelihood if one is infected or has a neighbor who is infected).

In a typical simulation run, we can see dynamics similar to the spread of COVID-19 in the United States and other countries in 2020. Harsh measures are imposed, and the contagion spread dies down. However, once lockdowns are lifted and typical behavior resumes, the rate of spread begins increasing again, and more become infected. Since there is no immunity in this model, these cyclical dynamics could continue indefinitely.
`;

export const code = `import { Agent, Environment, utils, Network, LineChartRenderer, CanvasRenderer } from "flocc";
import { Panel, Slider, Button } from "flocc-ui";

export const POPULATION = 150;
export const REWIRE = 0.05;
export const ISOLATE = 0.01;
export const R = 0.03;
export const DURATION = 200;
export const SW_CONNECTIVITY = 4;
export const LOCKDOWN_THRESHOLD = 0.33;
export const WEIGHT_THRESHOLD = 0.9;

const ui = (() => {
  let panel;
  let isolate;
  let weight;
  let R;
  let rewire;
  let duration;
  let threshold;
  let startStop;
  let reset;
  let infect;

  let _hasInit = false;

  function hasInit() {
    return _hasInit;
  }

  const doInfection = () => {
    const { environment } = window;
    const { duration } = environment.getData();
    utils.sample(environment.getAgents()).set("infected", duration);
    environment.renderers.forEach((r) => r.render());
  };

  function init(setup) {
    R = new Slider({
      name: "R",
      min: 0,
      max: 0.2
    });
    duration = new Slider({
      name: "duration",
      min: 10,
      max: 500,
      step: 1
    });
    weight = new Slider({
      name: "weight_threshold",
      label: "weight threshold",
      min: 0.6,
      max: 0.99
    });
    threshold = new Slider({
      name: "lockdown_threshold",
      label: "lockdown threshold",
      min: 0,
      max: 1
    });
    isolate = new Slider({
      name: "isolate",
      min: 0,
      max: 0.08,
      step: 0.005
    });
    rewire = new Slider({
      name: "rewire",
      min: 0,
      max: 1
    });
    startStop = new Button({
      label() {
        return window.environment.get("paused") ? "Start" : "Stop";
      },
      onClick() {
        window.environment.get("paused") ? run(true) : pause();
      }
    });
    reset = new Button({
      label: "Reset",
      onClick() {
        setup();
        pause();
      }
    });
    infect = new Button({
      label: "Infect",
      onClick: doInfection
    });
    panel = new Panel(window.environment, [
      threshold,
      weight,
      isolate,
      rewire,
      startStop,
      reset,
      infect
    ]);
    _hasInit = true;
  }

  function update(setup) {
    [panel, R, duration, startStop, infect].forEach(
      (c) => (c.environment = window.environment)
    );
    reset.onClick = () => {
      setup();
      pause();
    };
    infect.onClick = doInfection;
    startStop.onClick = () => {
      window.environment.get("paused") ? run(true) : pause();
    };
  }

  function pause() {
    cancelAnimationFrame(window.animationID);
    const { environment } = window;
    environment.renderers.forEach((r) => r.render());
    environment.set("paused", true);
  }

  function run(keepRunning = false) {
    const { environment } = window;
    if (keepRunning) environment.set("paused", false);
    environment.tick({ randomizeOrder: true });
    if (environment.get("paused")) return;
    if (environment.time >= 2000) return;
    window.animationID = requestAnimationFrame(run);
  }

  return { init, update, hasInit };
})();

function viz() {
  const { environment } = window;
  const renderer = new CanvasRenderer(environment, {
    width: 500,
    height: 500,
    autoPosition: true,
    connectionOpacity: 0.25
  });
  renderer.mount("#container");

  const infected = new LineChartRenderer(environment, {
    autoScale: true,
    range: {
      min: 0,
      max: 1.1
    },
    width: 300,
    height: 100
  });
  infected.mount("#infected");

  infected.metric("infected", {
    fn(arr) {
      return arr.filter((a) => a > 0).length / POPULATION;
    }
  });
  infected.metric("isolating", {
    fn: (arr) => utils.sum(arr) / POPULATION,
    color: "green"
  });

  const weight = new LineChartRenderer(environment, {
    autoScale: true,
    range: {
      min: 0,
      max: 1.1
    },
    width: 300,
    height: 100
  });
  weight.mount("#weight");

  weight.metric("weights", {
    color: "blue",
    fn(arr) {
      return utils.mean(arr.flat());
    }
  });
  weight.metric("weights", {
    color: "red",
    fn(arr) {
      return utils.median(arr.flat());
    }
  });

  const fatigue = new LineChartRenderer(environment, {
    autoScale: true,
    width: 300,
    height: 100
  });
  fatigue.mount("#fatigue");
  fatigue.metric("fatigue", {
    fn: utils.mean
  });
}

utils.seed(1);

/**
 * When a 'global lockdown' has been instituted,
 * all agents follow this function.
 */
function lockdownBehavior(agent) {
  const { infected, neighbors } = agent.getData();
  const { isolate } = window.environment.getData();
  const infectedNeighbors = neighbors.filter((n) => n.get("infected") > 0);
  let prob = isolate;
  if (infected > 0) {
    prob = isolate * 3;
  } else if (infectedNeighbors.length > 0) {
    prob = isolate * 2;
  }
  if (utils.uniform() < prob) selfIsolate(agent);
}

function weightInIsolation(oldWeight) {
  return oldWeight > window.environment.get("weight_threshold") ? 1 : 0;
}

/**
 * An agent may choose to self-isolate when
 * there is no global lockdown in effect
 * if they are infected.
 */
function selfIsolate(agent) {
  agent.set("isolating", true);
  window.network.neighbors(agent).forEach((neighbor, i) => {
    const oldWeight = agent.get("weights")[i];
    agent.get("weights")[i] = weightInIsolation(oldWeight);
    const nw = neighbor.get("weights");
    const nni = neighbor.get("neighbors").indexOf(agent);
    nw[nni] = weightInIsolation(oldWeight);
  });
}

/**
 * This function runs for every agent with every timestep
 * (and it may call other functions).
 */
function tick(agent) {
  const { environment, network } = window;
  let { infected, fatigue, isolating } = agent.getData();
  const { R, isolate, duration, lockdown_threshold } = environment.getData();
  network.neighbors(agent).forEach((b, i) => {
    const weight = agent.get("weights")[i];
    if (infected && utils.uniform() < R && utils.uniform() < weight) {
      if (b.get("infected") > 0) return;
      b.set("queue", () => {
        return { infected: duration };
      });
    }
  });

  const percentInfectedGlobally = environment.memo(
    () => environment.stat("infected").filter((i) => i > 0).length / POPULATION,
    "infected"
  );

  if (percentInfectedGlobally > lockdown_threshold) {
    lockdownBehavior(agent);
  } else if (infected > 0) {
    if (utils.uniform() < isolate) selfIsolate(agent);
  } else {
    agent.set("isolating", false);
    // reconnect with non-infected neighbors
    agent.get("neighbors").forEach((neighbor, i) => {
      if (neighbor.get("infected") > 0) return;
      agent.get("weights")[i] = agent.get("originalWeights")[i];

      const nw = neighbor.get("weights");
      const nni = neighbor.get("neighbors").indexOf(agent);
      nw[nni] = neighbor.get("originalWeights")[nni];
    });
  }

  if (isolating) {
    if (fatigue === 0) {
      fatigue = 0.1;
    } else {
      fatigue += (1 - fatigue) / 10;
    }
  } else if (fatigue > 0) {
    fatigue *= 0.9;
  }

  if (infected > 0) infected--;

  return {
    fatigue,
    infected
  };
}

function wireSmallWorld() {
  const { environment, network } = window;
  // connect agents to their closest neighbors
  for (let i = 0; i < POPULATION; i++) {
    const a = network.get(i);
    for (let j = -SW_CONNECTIVITY; j < SW_CONNECTIVITY; j++) {
      let index = i + j;
      if (index > POPULATION) index -= POPULATION;
      if (index < 0) index += POPULATION;
      const b = network.get(index);
      network.connect(a, b);
    }
  }

  // rewire
  for (let i = 0; i < POPULATION; i++) {
    const a = network.get(i);
    network.neighbors(a).forEach((b) => {
      if (utils.uniform() > environment.get("rewire")) return;
      const c = utils.sample(environment.getAgents());
      network.disconnect(a, b);
      network.connect(a, c);
    });
  }
}

(function setup() {
  const _R = window.environment ? window.environment.get("R") : R;
  const isolate = window.environment
    ? window.environment.get("isolate")
    : ISOLATE;
  const duration = window.environment
    ? window.environment.get("duration")
    : DURATION;
  const lockdown_threshold = window.environment
    ? window.environment.get("lockdown_threshold")
    : LOCKDOWN_THRESHOLD;
  const weight_threshold = window.environment
    ? window.environment.get("weight_threshold")
    : WEIGHT_THRESHOLD;
  const rewire = window.environment ? window.environment.get("rewire") : REWIRE;

  window.environment = new Environment();
  window.network = new Network();
  const { environment, network } = window;
  environment.set({
    isolate,
    R: _R,
    duration,
    lockdown_threshold,
    weight_threshold,
    paused: true,
    rewire
  });
  environment.use(network);

  viz();
  if (!ui.hasInit()) {
    ui.init(setup);
  } else {
    ui.update(setup);
  }

  // add agents
  for (let i = 0; i < POPULATION; i++) {
    const a = new Agent({
      color: (a) => (a.get("infected") > 0 ? "red" : "black"),
      size: (a) => (a.get("infected") > 0 ? 5 : 3),
      tick,
      infected: 0,
      isolating: false,
      fatigue: 0
    });

    environment.addAgent(a);
    network.addAgent(a);
  }

  wireSmallWorld();

  // remember neighbors (so can reconnect after isolating)
  for (let i = 0; i < POPULATION; i++) {
    const a = network.get(i);
    a.set("neighbors", Array.from(network.neighbors(a)));
    const weights = network.neighbors(a).map((neighbor, i) => {
      const neighborWeights = neighbor.get("weights");
      if (!neighborWeights) return utils.uniform() ** 2;
      // if neighbors already have weights, use those
      const existingWeightIndex = neighbor.get("neighbors").indexOf(a);
      const existingWeight = neighborWeights[existingWeightIndex];
      return existingWeight;
    });
    a.set("weights", weights);
    a.set("originalWeights", Array.from(weights));
  }

  // randomly infect three agents
  const sample3 = utils.sampler(3);
  sample3(environment.getAgents()).forEach((a) => {
    a.set("infected", environment.get("duration"));
  });

  environment.renderers.forEach((r) => r.render());
})();
`;

export const meta = {
  title: 'Minority Game',
  description: 'A model of market dynamics where agents compete to be in the minority, producing complex collective behavior.',
  topics: ["Economics", "Information Theory"],
  tags: ["Histogram","LineChartRenderer"],
};

export const content = `The <a href="https://en.wikipedia.org/wiki/Minority_game" target="_blank">Minority Game</a>, introduced by Challet and Zhang in 1997, is a simplified model of market dynamics. Each tick, agents independently choose one of two options (0 or 1). The winning side is the minority—those who chose the less popular option. This captures a core tension in competitive systems: if everyone follows the same strategy, that strategy becomes self-defeating.

Agents are equipped with multiple strategies (encoded as binary strings) that map recent history to a choice. After each round, strategies are scored based on whether they would have chosen the minority, and agents adopt their best-performing strategy. Despite the simplicity of the rules, the collective behavior is chaotic and unpredictable—the system never settles into a stable equilibrium, and no individual can consistently outperform the market. The model has been influential in <a href="https://en.wikipedia.org/wiki/Econophysics" target="_blank">econophysics</a> as a stylized illustration of how heterogeneous adaptive agents can produce complex aggregate dynamics.
`;

export const markup = `
    <h1>History: <span id="history"></span></h1>
    <div id="histogram"></div>
    <div id="line"></div>`;

export const code = `import { Agent, Environment, utils, LineChartRenderer, Histogram } from "flocc";

utils.seed(1);

const MEMORY = 6;
const STRATEGIES = 5;
let HISTORY = new Array(MEMORY)
  .fill(0)
  .map(() => utils.random().toString())
  .join("");
const POPULATION = 101;
const environment = new Environment();
const histogram = new Histogram(environment, {
  buckets: [0, 1],
  height: 200
});
histogram.metric("guess");
histogram.mount("#histogram");

const strToBin = (str) => {
  let output = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[str.length - i - 1] === "1") output += 2 ** i;
  }
  return output;
};

const line = new LineChartRenderer(environment, {
  range: { max: 110, min: -10 },
  height: 300,
  autoScale: true
});
line.metric("guess", {
  color: "red",
  fn: (arr) => utils.sum(arr.map((g) => +g))
});
line.mount("#line");

const guess = (a) => {
  return a.get("currentStrategy")[strToBin(HISTORY)];
};

function setup() {
  for (let i = 0; i < POPULATION; i++) {
    const strategies = [];
    const agent = new Agent({
      i,
      strategies,
      strategyScores: new Array(STRATEGIES).fill(0),
      guess,
      tick
    });
    while (strategies.length < STRATEGIES) {
      const strategy = new Array(2 ** MEMORY)
        .fill(0)
        .map(() => utils.random())
        .join("");
      strategies.push(strategy);
    }
    agent.set("currentStrategy", utils.sample(strategies));
    environment.addAgent(agent);
  }
}

function tick(agent) {
  if (agent.get("guess") === "1") environment.increment("ones");
  agent.set("queue", updateStrategies);
}

function updateStrategies(agent) {
  const minority = environment.get("ones") < POPULATION / 2 ? "1" : "0";
  const historyIndex = strToBin(HISTORY);
  const { strategies, strategyScores } = agent.getData();
  strategies.forEach((strategy, i) => {
    if (strategy[historyIndex] === minority) strategyScores[i]++;
  });
  let bestStrategies = [];
  let bestScore = 0;
  strategies.forEach((strategy, i) => {
    const score = strategyScores[i];
    if (score > bestScore) {
      bestStrategies = [strategy];
      bestScore = score;
    } else if (score === bestScore) {
      bestStrategies.push(strategy);
    }
  });
  const newStrategy = utils.sample(bestStrategies);
  agent.set("currentStrategy", newStrategy);
}

function run() {
  document.getElementById("history").innerHTML = HISTORY;
  environment.tick();
  const minority = environment.get("ones") < POPULATION / 2 ? "1" : "0";
  HISTORY += minority;
  HISTORY = HISTORY.slice(1);
  environment.set("ones", 0);
  if (environment.time < 1000) setTimeout(run, 50);
}

setup();
run();
`;

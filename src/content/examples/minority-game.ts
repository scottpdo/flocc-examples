export const meta = {
  title: 'Minority Game',
  description: 'Lorem ipsum',
  topics: ["Information Theory"],
  tags: ["Histogram","LineChartRenderer"],
};

export const content = `In the minority game (based on the NetLogo model of the same name), agents make a guess of either 0 or 1 with each tick of the simulation. After each tick, the goal for each agent is to be in the minority (guessing the same as less than half of all other agents).

Agents are initialized with a set of strategies — binary strings, i.e. 010111011000… — and the history of recent winning (minority) guesses are stored as another binary string. A strategy 'chooses' the agent's guess by converting the history to a decimal number (i.e. 1101 → 13) and selecting that digit from the strategy (which is always either 0 or 1). After each tick, an agent updates the scores of all its strategies and selects the one with the highest score, using it for subsequent guesses. Although this behavior is somewhat opaque, it does result in unpredictable, chaotic behavior as agents attempt to guess at and outperform the market.
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

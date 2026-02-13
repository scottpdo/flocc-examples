export const meta = {
  title: 'Tribute Model',
  description: 'Axelrod\'s model of state formation through tribute extraction and alliance commitment.',
  topics: ["Politics","Social Science"],
  tags: ["LineChartRenderer","TableRenderer"],
};

export const content = `This model, based on Robert Axelrod's <a href="http://www-personal.umich.edu/~axe/research/Building.pdf" target="_blank"><i>Building New Political Actors</i></a>, explores how state-like entities emerge, accumulate power, and eventually dissolve—dynamics exemplified by the rise and fall of the Soviet Union. The model abstracts the essential logic: entities demand <a href="https://en.wikipedia.org/wiki/Tribute" target="_blank">tribute</a> from neighbors, who must choose whether to pay or fight.

Ten entities occupy a linear landscape. Each turn, some demand tribute from others. Paying tribute creates <em>commitment</em>: a hierarchical relationship where the subordinate may later support the dominant entity in conflicts. Fighting erodes commitment but may be necessary to resist domination. Over many iterations, some entities grow powerful by extracting tribute and building networks of committed allies; others decline or are absorbed. The system exhibits characteristic historical patterns: periods of consolidation, the emergence of hegemonic actors, and eventual fragmentation as overextended powers lose control of their peripheries.
`;

export const markup = `
<div id="container"></div>
<div id="line"></div>`;

export const code = `import { Agent, Environment, utils, TableRenderer, LineChartRenderer } from "flocc";

/* ----- PARAMETERS ----- */
const POPULATION = 10;
const TURNS = 1500;
utils.seed(0);
/* ---------------------- */

const environment = new Environment();
const renderer = new TableRenderer(environment, {
  precision: 1,
  refresh: 100
});
renderer.columns = [
  "color",
  "wealth",
  ...new Array(POPULATION).fill(0).map((v, i) => \`c.\${i}\`)
];
renderer.mount("#container");

const line = new LineChartRenderer(environment, {
  autoScale: true,
  height: 300
});
line.mount("#line");

const colors = [
  "black",
  "blue",
  "green",
  "red",
  "orange",
  "purple",
  "cyan",
  "yellow",
  "brown",
  "gray"
];

for (let i = 0; i < POPULATION; i++) {
  line.metric("wealth", {
    color: colors[i],
    fn: arr => arr[i]
  });
}

/*
 * increase (or decrease) commitment of
 * a to b and b to a
 */
function setCommitment(a, b, amount = 0.1) {
  const aKey = \`c.\${a.get("i")}\`;
  const bKey = \`c.\${b.get("i")}\`;
  a.increment(bKey, amount);
  a.set(bKey, utils.clamp(a.get(bKey), 0, 1));
  b.increment(aKey, amount);
  b.set(aKey, utils.clamp(b.get(aKey), 0, 1));
}

function getCommitment(a, b) {
  return a.get(\`c.\${b.get("i")}\`);
}

// the amount it costs an agent to pay
function costToPay(a) {
  if (a.get("wealth") < 250) return a.get("wealth");
  return 250;
}

function allianceOf1stVersus2nd(a, b) {
  let dir = directionTo(a, b);
  const withA = [a];
  let other;
  // go from A away from B
  other = a.get(dir);
  while (getCommitment(other, a) > getCommitment(other, b)) {
    withA.push(other);
    other = other.get(dir);
  }
  // then go from A toward B
  dir = dir === "next" ? "prev" : "next";
  other = a.get(dir);
  while (getCommitment(other, a) > getCommitment(other, b)) {
    withA.push(other);
    other = other.get(dir);
  }
  return withA;
}

function pay(a, b) {
  const toPay = costToPay(a);
  a.decrement("wealth", toPay);
  b.increment("wealth", toPay);
  setCommitment(a, b);
}

function costToFight(alliance, target) {
  const cost = utils.sum(alliance.map(a => a.get("wealth"))) * 0.25;
  if (target.get("wealth") < cost) return target.get("wealth");
  return cost;
}

function fight(a, b) {
  const withA = allianceOf1stVersus2nd(a, b);
  const withB = allianceOf1stVersus2nd(b, a);
  const costToFightA = costToFight(withA, b);
  const costToFightB = costToFight(withB, a);

  let proportion = 1;
  if (costToFightB > a.get("wealth")) {
    proportion = a.get("wealth") / costToFightB;
  }
  if (costToFightA > b.get("wealth")) {
    proportion = b.get("wealth") / costToFightA;
  }

  a.decrement("wealth", proportion * costToFightB);
  b.decrement("wealth", proportion * costToFightA);

  // a and b mutually decrease commitments
  setCommitment(a, b, -0.1);

  // 1. a's alliance increases commitment to a and b's to b
  // 2. a's alliance decrease commitment to b and b's to a
  withA
    .filter(c => c !== a)
    .forEach(c => {
      setCommitment(c, a);
      setCommitment(c, b, -0.1);
    });
  withB
    .filter(c => c !== b)
    .forEach(c => {
      setCommitment(c, b);
      setCommitment(c, a, -0.1);
    });
}

function directionTo(a, b) {
  // determine which direction around the circle to travel
  let diff = b.get("i") - a.get("i");
  let dir = "prev";
  if ((diff > 0 && diff <= POPULATION / 2) || diff <= -POPULATION / 2) {
    dir = "next";
  }
  return dir;
}

/**
 * Determine whether agent a is able to target agent b
 */
function canTarget(a, b) {
  // contiguous agents can always target each other
  if (b === a.get("next") || b === a.get("prev")) return true;
  // travel from a toward b
  const dir = directionTo(a, b);
  let other = a;
  do {
    // move one step toward b
    other = other.get(dir);
    // if we've reached b, then a can target b
    if (other === b) return true;
    // if this agent's commitment to a is less than or equal
    // to its commitment toward b, it will not fight alongside
    // a, so a cannot target b
    if (getCommitment(other, a) <= getCommitment(other, b)) {
      return false;
    }
  } while (true);
}

/**
 * Agent a is targeting agent b.
 * b decides whether to fight or whether to pay.
 */
function target(a, b) {
  const allianceOfAVsB = allianceOf1stVersus2nd(a, b);
  const shouldFight = costToFight(allianceOfAVsB, b) < costToPay(b);
  if (shouldFight) {
    fight(a, b);
  } else {
    pay(b, a);
  }
}

function vulnerabilityOfBVersusA(a, b) {
  const withA = allianceOf1stVersus2nd(a, b);
  const withB = allianceOf1stVersus2nd(b, a);
  const withAWealth = utils.sum(withA.map(c => c.get("wealth")));
  const withBWealth = utils.sum(withB.map(c => c.get("wealth")));
  const vulnerability = (withBWealth - withAWealth) / withBWealth;
  return vulnerability;
}

function tick(agent) {
  // only 3 agents may make a move during any 1 tick
  if (environment.get("activated") === 3) return;
  environment.increment("activated");

  // get an array of all other agents who may be targeted
  const targetableOthers = environment.getAgents().filter(a => {
    return a !== agent && canTarget(agent, a);
  });

  // calculate vulnerabilities of those agents
  const vulnerabilities = utils.shuffle(targetableOthers).map(other => {
    const vulnerability = vulnerabilityOfBVersusA(other, agent);
    return { other, vulnerability };
  });

  // determine the most vulnerable agent to target
  let targetedOther = null;
  let optimimum = 0;
  vulnerabilities.forEach(({ other, vulnerability }) => {
    if (vulnerability < 0) return;
    vulnerability *= Math.max(other.get("wealth"), 250);
    if (vulnerability > optimimum) {
      optimimum = vulnerability;
      targetedOther = other;
    }
  });

  // if one exists, target it
  if (targetedOther !== null) {
    target(agent, targetedOther);
  }
}

function setup() {
  environment.set("activated", 0);

  for (let i = 0; i < POPULATION; i++) {
    const agent = new Agent({
      i,
      color: \`\${colors[i]} (\${i})\`,
      wealth: utils.random(300, 500)
    });
    agent.addRule(tick);
    environment.addAgent(agent);
  }

  const agents = environment.getAgents();

  agents.forEach((agent, i) => {
    // commitments to all other agents are 0,
    // except self, which is 1
    for (let j = 0; j < POPULATION; j++) {
      agent.set(\`c.\${j}\`, i === j ? 1 : 0);
    }
    // set prev and next agents
    agent.set("prev", agents[i === 0 ? POPULATION - 1 : i - 1]);
    agent.set("next", agents[i === POPULATION - 1 ? 0 : i + 1]);
  });
}

function run() {
  // tick once in random order
  environment.tick({ randomizeOrder: true });
  // reset the # of agents who have been activated
  environment.set("activated", 0);
  // increase everyone's wealth by 20
  environment.getAgents().forEach(a => {
    a.increment("wealth", 20);
  });
  // stop after the number of turns
  if (environment.time >= TURNS) return;
  requestAnimationFrame(run);
}

setup();
run();
`;

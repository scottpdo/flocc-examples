export const meta = {
  title: 'Race to the Center',
  description: 'Lorem ipsum',
  topics: ["Politics","Social Science"],
  tags: ["CanvasRenderer","LineChartRenderer"],
};

export const content = `This simple model reflects a phenomenon of two-party politics where both candidates shift their positions to garner more votes. Voters are represented <a href="https://en.wikipedia.org/wiki/Left–right_political_spectrum" target="_blank">along a single axis</a>, and two candidates are initially placed at random positions in the left half and the right half (blue and red, respectively, as in U.S. politics). A voter casts their ballot for the candidate whose position is closer to theirs.

After each round of voting, the candidate with fewer votes shifts their position (there is no incentive for an incumbent to adopt a new position). With <code>LEARNING_RATE</code> set to 1, they will inevitably move toward the center, with the opponent doing the same if and when they are the minority candidate. With a lower <code>LEARNING_RATE</code>, the process still moves toward the center, but resembles a random walk, where candidates try out new positions that may be less optimal and find equilibrium more slowly.
`;

export const markup = `
<div id="container"></div>
<div style="display: flex;">
  <div>
    <h3>Votes</h3>
    <div id="line"></div>
  </div>
  <div>
    <h3>Distance to Center</h3>
    <div id="distance"></div>
  </div>
</div>`;

export const code = `import { Agent, Environment, CanvasRenderer, utils, LineChartRenderer } from "flocc";

const width = window.innerWidth;
const height = 80;
const POPULATION = 201;

let LEARNING = true;
let LEARNING_RATE = 0.4;

let left;
let right;

const environment = new Environment({
  width,
  height,
  torus: false
});
const renderer = new CanvasRenderer(environment, {
  background: "#eee",
  width,
  height
});
renderer.mount("#container");

const chart = new LineChartRenderer(environment, {
  autoScale: true,
  height: 250,
  width: width / 2,
  range: {
    max: POPULATION,
    min: 0
  }
});
chart.metric("left", {
  color: "blue",
  fn: utils.sum
});
chart.metric("right", {
  color: "red",
  fn: utils.sum
});
chart.mount("#line");

const distance = new LineChartRenderer(environment, {
  autoScale: true,
  height: 250,
  width: width / 2,
  range: {
    max: width / 2,
    min: 0
  }
});
distance.metric("left", {
  color: "blue",
  fn() {
    return Math.abs(width / 2 - left.get("x"));
  }
});
distance.metric("right", {
  color: "red",
  fn() {
    return Math.abs(width / 2 - right.get("x"));
  }
});
distance.mount("#distance");

function vote(agent) {
  let choice;
  const dl = utils.distance(agent, left);
  const dr = utils.distance(agent, right);
  if (dl < dr) {
    choice = left;
  } else if (dl > dr) {
    choice = right;
  } else {
    choice = utils.sample([left, right]);
  }
  choice.increment("votes");
  return {
    left: choice === left ? 1 : 0,
    right: choice === right ? 1 : 0
  };
}

function shift(agent) {
  const { votes } = agent.getData();
  if (votes < POPULATION / 2) {
    agent.increment("x", agent.get("direction"));
    // prevent ideological crossover
    // or going out of ideological bounds
    const min = agent.get("color") === "blue" ? 0 : width / 2;
    const max = agent.get("color") === "blue" ? width / 2 : width;
    agent.set("x", utils.clamp(agent.get("x"), min, max));

    if (LEARNING) {
      let choices = [1, -1];
      if (LEARNING_RATE === 1) {
        choices = [agent.get("lastVotes") > votes ? -1 : 1];
      } else {
        for (let i = LEARNING_RATE; i > 0; i -= 0.1) {
          choices.push(agent.get("lastVotes") > votes ? -1 : 1);
        }
      }
      agent.set("direction", agent.get("direction") * utils.sample(choices));
    } else if (!LEARNING) {
      agent.set("direction", utils.sample([1, -1]));
    }

    agent.set("lastVotes", votes);
  }

  return { votes: 0 };
}

function setup() {
  for (let i = 0; i < POPULATION; i++) {
    let x;
    do {
      x = utils.gaussian(width / 2, width / 4);
    } while (x < 0 || x > width);
    environment.addAgent(
      new Agent({
        x,
        y: height / 2,
        size: 1,
        tick: vote
      })
    );
  }
  left = new Agent({
    x: utils.random(0, width / 4),
    y: height / 2,
    size: 8,
    color: "blue",
    votes: 0,
    direction: utils.sample([1, -1]),
    tick: shift
  });
  environment.addAgent(left);
  right = new Agent({
    x: utils.random((3 * width) / 4, width),
    y: height / 2,
    size: 8,
    color: "red",
    votes: 0,
    direction: utils.sample([1, -1]),
    tick: shift
  });
  environment.addAgent(right);
}

function run() {
  environment.tick();
  if (environment.time < 2500) requestAnimationFrame(run);
}

setup();
run();
`;

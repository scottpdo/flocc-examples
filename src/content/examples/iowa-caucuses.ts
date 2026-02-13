export const meta = {
  title: 'Iowa Caucuses',
  description: 'A model of ranked-choice deliberation on a social network, capturing the Iowa caucus process.',
  topics: ["Politics", "Social Science"],
  tags: ["CanvasRenderer","Network","TableRenderer"],
};

export const content = `This model simulates the <a href="https://en.wikipedia.org/wiki/Iowa_caucuses" target="_blank">Iowa caucuses</a>, a distinctive American political institution that blends voting with social deliberation. Unlike a simple ballot, the caucus involves multiple rounds: voters physically cluster with their preferred candidate, and candidates failing to reach a 15% viability threshold are eliminated, forcing their supporters to realign.

Voters and candidates are positioned on a two-dimensional ideological space (a <a href="https://en.wikipedia.org/wiki/Political_compass" target="_blank">political compass</a>). Voters initially support the candidate nearest to their ideological position. Voters are also embedded in a social network—mostly ideological neighbors, with some cross-spectrum ties. When a voter's candidate becomes non-viable, they switch to a candidate supported by one of their network connections, simulating the persuasion and horse-trading that characterize real caucuses. This network structure allows initially marginal candidates to gain viability through social influence—a dynamic impossible in conventional voting models.
`;

export const code = `import { Agent, Environment, CanvasRenderer, Network, utils, TableRenderer } from "flocc";

utils.seed(1);

const colors = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "black"
];
const VOTERS = 500;
const CANDIDATES = colors.length;

const width = Math.min(window.innerWidth, window.innerHeight);
const height = Math.min(window.innerWidth, window.innerHeight);

const ui = (() => {
  return {
    drawAxes(compass, width, height) {
      const dpr = window.devicePixelRatio;
      const { context } = compass;
      context.save();
      context.beginPath();
      context.globalAlpha = 0.25;
      context.moveTo(dpr * 0, (dpr * height) / 2);
      context.lineTo(dpr * width, (dpr * height) / 2);
      context.moveTo((dpr * width) / 2, dpr * 0);
      context.lineTo((dpr * width) / 2, dpr * height);
      context.stroke();
      context.restore();
    },
    log(environment, showWinner) {
      const voteCount = document.getElementById("vote-count");
      const winner = showWinner ? "All remaining candidates over 15%" : "";
      voteCount.innerHTML = \`<h3>Round \${environment.time - 1}: \${winner}</h3>\`;
    }
  };
})();

const xy = () => {
  const a = utils.gaussian(Math.PI, Math.PI / 4);
  const r = utils.gaussian(0.2, 0.08, true);
  const x = r * Math.cos(a);
  const y = r * Math.sin(a);
  return { x, y };
};

const environment = new Environment();
const network = new Network();
environment.use(network);

['table', 'vote-count', 'compass'].forEach(id => {
  const el = document.createElement('div');
  el.id = id;
  document.getElementById('container').appendChild(el);
});

const compass = new CanvasRenderer(environment, {
  width,
  height,
  scale: width,
  origin: {
    x: -0.5,
    y: -0.5
  },
  connectionColor: "#bbb"
});
compass.mount("#compass");

const table = new TableRenderer(environment, {
  filter: (a) => a.get("type") === "candidate"
});
table.columns = ["color", "votes"];
table.mount("#table");

function getVoters() {
  return environment.getAgents().filter((a) => a.get("type") === "voter");
}

function getCandidates() {
  return environment.getAgents().filter((a) => a.get("type") === "candidate");
}

function tickVoter(agent) {
  const candidates = environment.memo(getCandidates);
  let candidate = agent.get("candidate");

  if (environment.time === 0) {
    return;
  }

  // voting for the first time
  if (!candidate) {
    candidate = utils.sample(
      candidates,
      candidates.map((c) => {
        const id = Math.max(0.5 - utils.distance(c, agent), 0.0001);
        return id ** 3;
      })
    );
  } else if (candidate && candidate.get("valid") === false) {
    const neighborCandidates = network
      .neighbors(agent)
      .map((a) => a.get("candidate"));
    candidate = utils.sample(neighborCandidates);
    if (!candidate) return;
  }

  candidate.increment("votes");
  agent.set("candidate", candidate);
  agent.set("color", candidate.get("color"));
}

function setup() {
  for (let i = 0; i < VOTERS; i++) {
    const { x, y } = xy();
    const voter = new Agent({
      x,
      y,
      color: "gray",
      size: 2,
      type: "voter"
    });
    voter.addRule(tickVoter);
    environment.addAgent(voter);
    network.addAgent(voter);
  }
  for (let i = 0; i < CANDIDATES; i++) {
    const { x, y } = xy();
    const candidate = new Agent({
      x,
      y,
      color: colors[i],
      size: 6,
      type: "candidate",
      votes: 0
    });
    environment.addAgent(candidate);
    network.addAgent(candidate);
  }
  const voters = getVoters();
  voters.forEach((voter) => {
    const neighbors = Array.from(voters);
    neighbors.sort(
      (a, b) => utils.distance(voter, a) - utils.distance(voter, b)
    );
    const r = utils.random(2, 7);
    for (let i = 0; i < r; i++) {
      network.connect(voter, neighbors[i]);
    }
  });
  // randomly rewire
  voters.forEach((voter) => {
    const connections = network.neighbors(voter);
    connections.forEach((connect) => {
      if (utils.uniform() < 0.05) {
        network.disconnect(voter, connect);
        network.connect(voter, utils.sample(voters));
      }
    });
  });
}

function draw() {
  environment.tick({ randomizeOrder: true });
  ui.drawAxes(compass, width, height);

  const candidates = environment.memo(getCandidates);
  const voters = environment.memo(getVoters);

  const serializedVotes = candidates.map((c) => c.get("votes")).join(",");
  if (serializedVotes === environment.get("serializedVotes")) {
    return ui.log(environment, true);
  } else {
    environment.set("serializedVotes", serializedVotes);
  }

  ui.log(environment);

  candidates.forEach((c) => {
    const { votes } = c.getData();
    const valid = votes / voters.length >= 0.15;
    c.set("valid", valid);
    // reset votes
    c.set("lastVotes", votes);
    c.set("votes", 0);
  });

  setTimeout(draw, 1500);
}

setup();
draw();
`;

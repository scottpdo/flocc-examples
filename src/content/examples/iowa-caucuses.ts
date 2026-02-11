export const meta = {
  title: 'Iowa Caucuses',
  description: 'Lorem ipsum',
  topics: ["Politics"],
  tags: ["CanvasRenderer","Network","TableRenderer"],
};

export const content = `This is a model of the <a href="https://en.wikipedia.org/wiki/Iowa_caucuses" target="_blank">Iowa caucuses</a>, a political event that combines voting and debate/discussion. In this model, voters and candidates are represented on a political compass, with each point in space representing a unique ideological viewpoint, all drawn from the same distribution function. Voters are also connected to each other, representing social relationships. They are connected to their closest neighbors ideologically, with random connections drawn to voters on other parts of the political spectrum.

The caucus proceeds like this: In the first round, each voter casts their vote for the candidate whose ideological location is 'closest' to theirs. Then, in following rounds, candidates receiving less than 15% of the total vote are marked not 'viable,' and voters who chose a nonviable candidate vote again by randomly picking one of the candidates chosen by their connections (including the same candidate). This continues until all candidates receiving votes have over 15% of the total.

By situating the landscape of voters on a social network, it is possible for candidates receiving less than 15% of the vote in the first round to become viable candidates through their voters influencing others in subsequent rounds.
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

export const meta = {
  title: 'Nowak and May\'s Prisoner\'s Dilemma',
  description: 'Lorem ipsum',
  topics: ["Complex Systems","Game Theory"],
  tags: ["Terrain"],
};

export const content = `In a <a href="https://www.nature.com/articles/359826a0" target="_blank">1992 <i>Nature</i> article</a>, Nowak & May published surprising findings in their spatial model of the Prisoner's Dilemma. Although the Nash equilibrium of the standard <a href="https://en.wikipedia.org/wiki/Prisoner%27s_dilemma" target="_blank">Prisoner's Dilemma</a> is for neither player to cooperate, in Nowak & May's model, cooperation and defection dynamically coexist, spreading and receding across the 2-dimensional lattice of 'players.' Each player considers the payoffs that each of its neighbors receives by playing their current strategy (cooperate or defect), and then changes their strategy to the highest-scoring strategy among their neighbors. Defecting (colored in red, with first-time defectors yellow) spreads from a single initial defector at the center, but cooperating (blue, with first-time cooperators green) is always able to remain a significant strategy.

A year after the publishing of Nowak & May's model, <a href="https://www.pnas.org/content/90/16/7716" target="_blank">Huberman & Glance responded in PNAS</a>, proving that the hypnotizing dynamic patterns created by the Nowak & May model were an artifact of synchronous updating across all players — if players update asynchronously, defecting will become the dominant equilibrium strategy.`;

export const code = `import { Environment, CanvasRenderer, Terrain, Colors, NumArray } from "flocc";

const DEFECTOR_GAIN = 1.85;

let width = ((0.9 * Math.min(window.innerWidth, window.innerHeight)) | 0) / 2;
let scale = 2;
while (width > 500) {
  width = Math.round(width / 2);
  scale *= 2;
}
if (width % 2 === 0) width++;
const height = width;

class Array2D {
  constructor(width, height) {
    this.data = new NumArray();
    this.width = width;
    this.height = height;
  }

  getIndex(x, y) {
    while (x < 0) x += this.width;
    while (y < 0) y += this.height;
    while (x >= this.width) x -= this.width;
    while (y >= this.height) y -= this.height;
    return x + this.width * y;
  }

  set(x, y, n) {
    this.data.set(this.getIndex(x, y), n);
  }

  get(x, y) {
    return this.data.get(this.getIndex(x, y));
  }
}

const scores = new Array2D(width, height);

const environment = new Environment();
const terrain = new Terrain(width, height, {
  scale
});
environment.use(terrain);

const renderer = new CanvasRenderer(environment, {
  width: width * scale,
  height: height * scale
});
renderer.mount("#container");

const DEFECT = Colors.RED;
const COOPERATE = Colors.BLUE;
const RECENT_DEFECTOR = Colors.YELLOW;
const RECENT_COOPERATOR = Colors.GREEN;
const match = (p1, p2) =>
  p1.r === p2.r && p1.g === p2.g && p1.b === p2.b && p1.a === p2.a;
const isDefector = (p) => match(p, DEFECT) || match(p, RECENT_DEFECTOR);
const isCooperator = (p) => match(p, COOPERATE) || match(p, RECENT_COOPERATOR);

function setup() {
  terrain.init((x, y) => {
    if (x === (width - 1) / 2 && y === (width - 1) / 2) {
      return DEFECT;
    }
    return COOPERATE;
  });
  terrain.addRule((x, y) => {
    const here = terrain.sample(x, y);
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (x + dx < 0 || y + dy < 0 || x + dx >= width || y + dy >= width)
          continue;
        neighbors.push(terrain.sample(x + dx, y + dy));
      }
    }
    // On even turns, calculate scores
    if (environment.time % 2 === 0) {
      let score = 0;
      neighbors.forEach((neighbor) => {
        if (isCooperator(here) && isCooperator(neighbor)) {
          score += 1;
        } else if (isDefector(here) && isCooperator(neighbor)) {
          score += DEFECTOR_GAIN;
        }
      });
      scores.set(x, y, score);
    } // On odd turns, update
    else {
      let max = -Infinity;
      let maxX = 0;
      let maxY = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (x + dx < 0 || y + dy < 0 || x + dx >= width || y + dy >= width)
            if (dx === 0 && dy === 0) continue;
          if (scores.get(x + dx, y + dy) > max) {
            max = scores.get(x + dx, y + dy);
            maxX = x + dx;
            maxY = y + dy;
          }
        }
      }
      // cooperator -> defector, first turn
      const winning = terrain.sample(maxX, maxY);

      if (match(here, RECENT_DEFECTOR) && isDefector(winning)) {
        return DEFECT;
      }
      if (match(here, RECENT_COOPERATOR) && isCooperator(winning)) {
        return COOPERATE;
      }

      if (isCooperator(here) && isDefector(winning)) {
        return RECENT_DEFECTOR;
      }
      if (isDefector(here) && isCooperator(winning)) {
        return RECENT_COOPERATOR;
      }
    }
  });
}

function run() {
  environment.tick({ randomizeOrder: false });
  requestAnimationFrame(run);
}

setup();
run();
`;

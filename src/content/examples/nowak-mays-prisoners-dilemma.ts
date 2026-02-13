export const meta = {
  title: 'Nowak and May\'s Prisoner\'s Dilemma',
  description: 'Spatial game theory showing how cooperation and defection coexist in mesmerizing dynamic patterns.',
  topics: ["Complex Systems","Game Theory"],
  tags: ["Terrain"],
};

export const content = `In a landmark <a href="https://www.nature.com/articles/359826a0" target="_blank">1992 <i>Nature</i> paper</a>, Nowak and May demonstrated that embedding the <a href="https://en.wikipedia.org/wiki/Prisoner%27s_dilemma" target="_blank">Prisoner's Dilemma</a> in space fundamentally changes its dynamics. In the classic non-spatial game, the <a href="https://en.wikipedia.org/wiki/Nash_equilibrium" target="_blank">Nash equilibrium</a> is mutual defection—cooperation is irrational. But when players occupy cells on a lattice and imitate the most successful strategy among their neighbors, cooperation and defection coexist in perpetual, mesmerizing flux.

Starting from a single defector at the center (red/yellow), defection spreads outward but never dominates; cooperators (blue/green) persist in clusters and counterattack. The resulting patterns—kaleidoscopic waves and stable boundaries—arise from local imitation dynamics. However, as <a href="https://www.pnas.org/content/90/16/7716" target="_blank">Huberman and Glance showed in 1993</a>, these patterns depend critically on synchronous updating; with asynchronous updates (one player at a time), defection eventually wins. The model illustrates both the power of spatial structure to sustain cooperation and the sensitivity of outcomes to seemingly minor procedural details.`;

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

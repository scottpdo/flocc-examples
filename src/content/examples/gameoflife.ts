export const meta = {
  title: 'Game of Life',
  description: 'Conway\'s cellular automaton demonstrating how complex patterns emerge from simple rules of birth, survival, and death.',
  topics: ['Information Theory'],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `The Game of Life, devised by mathematician <a href="https://en.wikipedia.org/wiki/John_Horton_Conway" target="_blank">John Horton Conway</a> in 1970, is a cellular automaton—a grid of cells that evolve according to local rules. Despite having no players and requiring no input after its initial configuration, the Game of Life demonstrates how remarkable complexity can emerge from simple deterministic rules, making it a foundational example in the study of <a href="https://en.wikipedia.org/wiki/Emergence" target="_blank">emergence</a> and self-organization.

The rules are straightforward: each cell is either alive or dead, and its fate depends on the number of living neighbors in the eight surrounding cells. A living cell with fewer than two or more than three living neighbors dies (from underpopulation or overcrowding, respectively). A living cell with two or three neighbors survives. A dead cell with exactly three living neighbors becomes alive. These minimal rules give rise to an astonishing variety of stable structures, oscillators, and self-replicating patterns—including "gliders" that traverse the grid and "guns" that emit them indefinitely.`;

export const code = `import { Environment, CanvasRenderer, Terrain } from "flocc";

/* ---------- PARAMETERS ---------- */
/* -------------------------------- */
// how many cells are ALIVE at the start
const PERCENT_ALIVE_AT_START = 0.15;

// in grayscale mode, these are numbers (255 = white,
// 0 = black). In color mode, they should be pixel-like
// objects with r/g/b/a key-value pairs. Try some from
// Colors object, like Colors.GREEN
const ALIVE = 255;
const DEAD = 0;

// the radius of neighbors for a cell to look at
const NEIGHBOR_RADIUS = 1;

// if the number of live neighbors surrounding a cell
// is in this array, that cell will live on (or come to life)
const WILL_LIVE = [3];

// if the number of live neighbors surrounding a cell
// is in this array, that cell will die (or remain dead)
const WILL_DIE = [0, 1, 4, 5, 6, 7, 8];
/* -------------------------------- */
/* -------------------------------- */

const [width, height] = [600, 600];
const environment = new Environment({ width, height });
const renderer = new CanvasRenderer(environment, { width, height });
renderer.mount("#container");

const terrain = new Terrain(width / 3, height / 3, {
  // remove or set this to false to
  // use color mode
  grayscale: true,
  scale: 3
});
environment.use(terrain);

function setup() {
  terrain.init((x, y) => {
    return Math.random() < PERCENT_ALIVE_AT_START ? ALIVE : DEAD;
  });
}

terrain.addRule((x, y) => {
  const livingNeighbors = terrain
    .neighbors(x, y, NEIGHBOR_RADIUS, true)
    .filter(v => v === ALIVE).length;
  if (WILL_LIVE.includes(livingNeighbors)) {
    return ALIVE;
  } else if (WILL_DIE.includes(livingNeighbors)) {
    return DEAD;
  }
});

function run() {
  environment.tick();

  setTimeout(run, 50);
  // comment out the line above and uncomment
  // the line below to go faster!
  // requestAnimationFrame(run);
}

setup();
run();
`;

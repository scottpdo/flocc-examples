export const meta = {
  title: 'Langton\'s Ant',
  description: 'Lorem ipsum',
  topics: ["Artificial Life"],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `<a href="https://mathworld.wolfram.com/LangtonsAnt.html" target="_blank">Langton's Ant</a> (designed by artificial life researcher <a href="https://en.wikipedia.org/wiki/Christopher_Langton" target="_blank">Christopher Langton</a>) is a cellular automaton with a single agent (the 'ant') moving across a two-dimensional grid. When the ant moves one step forward, it changes the color of the cell it occupies (from black to white and vice-versa). It also rotates clockwise or counter-clockwise depending on if it is on a black or white cell.

Although at the beginning of the simulation the ant appears to traverse a chaotic path, leaving behind random black and white cells in its wake, at about 10,000 steps in, it discovers a pattern, and begins tracing a wide path toward the southeast. On an infinite grid, it would continue in this direction forever, but on a toroidal grid (as shown here), it eventually collides with cells it previously traced, and returns to chaos.
`;

export const code = `import { Environment, CanvasRenderer, Vector, Terrain } from "flocc";

let [width, height] = [window.innerWidth, window.innerHeight];
const scale = 3;
while (width % scale !== 0) width++;
while (height % scale !== 0) height++;

const NORTH = new Vector(0, -1);
const SOUTH = new Vector(0, 1);
const EAST = new Vector(1, 0);
const WEST = new Vector(-1, 0);
const DIRS = [NORTH, EAST, SOUTH, WEST];

const environment = new Environment({ width, height });
const terrain = new Terrain(width / scale, height / scale, {
  grayscale: true,
  scale
});
environment.use(terrain);

const renderer = new CanvasRenderer(environment, { width, height });
renderer.mount("#container");

const ANT = {
  pos: new Vector(
    (window.innerWidth / (2 * scale)) | 0,
    (window.innerHeight / (2 * scale)) | 0
  ),
  dir: WEST
};

function setup() {
  terrain.init((x, y) => 255);
}

let t = 0;

function run() {
  const { pos, dir } = ANT;
  // update the color where the ant is
  terrain.set(pos.x, pos.y, terrain.sample(pos.x, pos.y) === 255 ? 0 : 255);
  // move the ant
  pos.x += dir.x;
  pos.y += dir.y;
  // turn the ant
  const i = DIRS.indexOf(dir);
  if (terrain.sample(pos.x, pos.y) === 0) {
    ANT.dir = i === DIRS.length - 1 ? DIRS[0] : DIRS[i + 1];
  } else {
    ANT.dir = i === 0 ? DIRS[DIRS.length - 1] : DIRS[i - 1];
  }
  if (t < 20) {
    t++;
    return run();
  } else {
    t = 0;
  }
  environment.tick();
  requestAnimationFrame(run);
}

setup();
run();
`;

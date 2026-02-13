export const meta = {
  title: 'Langton\'s Ant',
  description: 'A simple cellular automaton that produces chaos, then unexpectedly builds an infinite highway.',
  topics: ["Artificial Life", "Information Theory"],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `<a href="https://mathworld.wolfram.com/LangtonsAnt.html" target="_blank">Langton's Ant</a>, invented by artificial life pioneer <a href="https://en.wikipedia.org/wiki/Christopher_Langton" target="_blank">Christopher Langton</a> in 1986, is a two-dimensional cellular automaton with strikingly simple rules: a single "ant" moves across a grid, flipping the color of each cell it visits (black to white, white to black) and turning right on white cells, left on black cells.

Despite this minimalism, the ant's behavior is surprisingly complex. For roughly the first 10,000 steps, the ant wanders chaotically, leaving behind an apparently random pattern of cells. Then, abruptly and without any change in rules, it begins constructing an unbounded diagonal "highway"—a repeating pattern that extends infinitely on an unbounded grid. This emergent order from chaos has never been fully explained mathematically; it remains an open problem whether the highway always appears. On a toroidal (wrap-around) grid as shown here, the highway eventually collides with its own history, returning the system to chaos.
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

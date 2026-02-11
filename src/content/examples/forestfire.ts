export const meta = {
  title: 'Forest Fire',
  description: 'Lorem ipsum',
  topics: ["Ecology"],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `The fire model simulates how fire spreads through a forest. It starts with a wave of trees simultaneously catching fire, and with every tick of the simulation, a tree with at least one neighboring tree (to the north, south, east, or west) on fire will also catch fire.

The PERCENT_FULL parameter determines how crowded the forest is. Set to 1.0 (100% full), every cell in the grid will be occupied by a tree, and the fire will deterministically sweep across the entire forest. However, around 0.59 (59% full), there is a threshold, and value below 0.59 will rarely result in the entire forest being burned, while above 0.59 the entire forest will almost always catch fire.

Read more at https://en.wikipedia.org/wiki/Forest-fire_model
`;

export const code = `import { Environment, Terrain, Colors, CanvasRenderer } from "flocc";

/* ----- PARAMETERS ----- */

const PERCENT_FULL = 0.59;

/* ----------------------- */

let [width, height] = [window.innerWidth, window.innerHeight];
const scale = (Math.min(width, height) / 200) | 0;
while (width % scale !== 0) width++;
while (height % scale !== 0) height++;

const environment = new Environment({ width, height });
const renderer = new CanvasRenderer(environment, {
  width,
  height
});
renderer.mount("#container");

const terrain = new Terrain(width / scale, height / scale, {
  scale
});
environment.use(terrain);

const empty = Colors.BLACK;
// Colors.GREEN is a little too dark for this
const notOnFire = { r: 0, g: 240, b: 20, a: 255 };
const onFire = Colors.RED;

function isOnFire(p) {
  return p.r === onFire.r && p.g === onFire.g && p.b === onFire.b;
}

function isEmpty(x, y) {
  const p = terrain.sample(x, y);
  return p.r === empty.r && p.g === empty.g && p.b === empty.b;
}

function isNotEmpty(x, y) {
  const p = terrain.sample(x, y);
  return p.r === notOnFire.r && p.g === notOnFire.g && p.b === notOnFire.b;
}

function setup() {
  terrain.init((x, y) => {
    if (Math.random() > PERCENT_FULL) return empty;
    return notOnFire;
  });
  terrain.init((x, y) => {
    if (isNotEmpty(x, y) && x === 0) return onFire;
  });
  terrain.addRule(function(x, y) {
    if (isEmpty(x, y)) return;
    const neighbors = terrain.neighbors(x, y);
    for (let i = 0; i < neighbors.length; i++) {
      if (isOnFire(neighbors[i])) return onFire;
    }
  });
}

function run() {
  environment.tick();
  window.requestAnimationFrame(run);
}

setup();
run();
`;

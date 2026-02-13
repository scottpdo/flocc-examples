export const meta = {
  title: 'Forest Fire',
  description: 'A percolation model demonstrating critical thresholds in fire spread through a forest.',
  topics: ["Ecology", "Physics"],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `The Forest Fire model is a classic demonstration of <a href="https://en.wikipedia.org/wiki/Percolation_theory" target="_blank">percolation</a>—the study of how connectivity in a system determines whether a process (here, fire) can spread across it. Trees are randomly distributed on a grid according to a density parameter (<code>PERCENT_FULL</code>). Fire ignites on one edge and propagates to orthogonally adjacent trees (north, south, east, west) each tick.

The model exhibits a <a href="https://en.wikipedia.org/wiki/Percolation_threshold" target="_blank">critical threshold</a> around 59% density. Below this threshold, the forest is too sparse for fire to percolate across the grid—isolated clusters burn out independently. Above the threshold, trees form a connected network that allows fire to sweep through nearly the entire landscape. This phase transition is sharp: small changes in density near the critical point produce dramatic differences in outcome. The same mathematics governs phenomena from epidemic spread to the conductivity of composite materials.
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

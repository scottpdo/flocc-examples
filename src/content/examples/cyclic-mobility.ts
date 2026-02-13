export const meta = {
  title: 'Cyclic Mobility',
  description: 'Rock-paper-scissors dynamics in space, producing spiraling patterns from cyclic competition.',
  topics: ["Complex Systems", "Ecology"],
  tags: ["CanvasRenderer","Flocc UI","Terrain"],
};

export const content = `This implementation of <a href="https://www.complexity-explorables.org/explorables/cycledelic/" target="_blank">Dirk Brockmann's "Cycledelic" model</a> simulates three species locked in cyclic competition: A defeats B, B defeats C, and C defeats A—the familiar logic of rock-paper-scissors. Unlike the discrete game, however, here the competition unfolds continuously across a two-dimensional terrain, with each species diffusing through space and displacing its prey.

The cyclic dominance relationship produces striking emergent patterns: rotating spirals, traveling waves, and turbulent eddies. These structures arise from the tension between local competition (which creates expanding fronts) and spatial diffusion (which spreads species outward). Similar dynamics appear in bacterial colony growth and certain chemical reaction-diffusion systems. By adjusting predation, competition, and diffusion parameters, the system transitions between qualitatively different regimes—from stable coexistence to chaotic, ever-shifting mosaics.
`;

export const code = `import { Environment, CanvasRenderer, utils, Terrain } from "flocc";
import { Panel, Slider, Button } from "flocc-ui";

/* ---------- PARAMETERS ---------- */
/* -------------------------------- */
// how aggressively one 'species' preys on another
const PREDATION = 2; // between 0 and 3

// how much competition there is when two
// 'species' meet -- if this is higher than PREDATION,
// then movement will slow down
const COMPETITION = 1.5; // between 0 and 3

// the ambient rate at which 'species' expand
// into new territory
const DIFFUSION = 0.05; // between 0 and 0.1
/* -------------------------------- */
/* -------------------------------- */

let [width, height] = [window.innerWidth, window.innerHeight];
const environment = new Environment({ width, height });

// bind environment variables to parameters
environment.set("predation", PREDATION);
environment.set("competition", COMPETITION);
environment.set("diffusion", DIFFUSION);

const renderer = new CanvasRenderer(environment, { width, height });
renderer.mount("#container");
environment.use(renderer);

const scale = (Math.min(width, height) / 120) | 0;
while (width % scale !== 0) width++;
while (height % scale !== 0) height++;
const terrain = new Terrain(width / scale, height / scale, { scale });
environment.use(terrain);

// this helper function, given a cell's neighbor
// and cycle order, tells the r/g/b value how much
// to change
function change(neighbors, key, a, b, c) {
  return (
    a *
      (environment.get("predation") * (b - c) +
        a -
        environment.get("competition") * (b + c) -
        a ** 2) +
    environment.get("diffusion") *
      utils.sum(neighbors.map((n) => n[key] / 255 - a))
  );
}

function setup() {
  // initialize every pixel to a random color
  terrain.init(() => {
    return {
      r: utils.random(0, 255),
      g: utils.random(0, 255),
      b: utils.random(0, 255),
      a: 255
    };
  });
  terrain.addRule((x, y) => {
    // get the color of this coordinate
    let { r, g, b, a } = terrain.sample(x, y);

    // normalize so that we deal with values
    // between 0-1 instead of 0-255
    r /= 255;
    g /= 255;
    b /= 255;

    // get the neighbors of this coordinate
    const neighbors = terrain.neighbors(x, y, 1, true);

    // apply the change function to r, g, and b values
    const dr = change(neighbors, "r", r, g, b);
    const dg = change(neighbors, "g", g, b, r);
    const db = change(neighbors, "b", b, r, g);

    // restore to 0-255 range and return new values
    return {
      r: 255 * (r + dr),
      g: 255 * (g + dg),
      b: 255 * (b + db),
      a
    };
  });
  new Panel(environment, [
    new Slider({
      name: "predation",
      min: 0,
      max: 3
    }),
    new Slider({
      name: "competition",
      min: 0,
      max: 3
    }),
    new Slider({
      name: "diffusion",
      min: 0,
      max: 0.1,
      step: 0.002
    }),
    new Button({
      label: "Reset",
      onClick() {
        environment.set("predation", PREDATION);
        environment.set("competition", COMPETITION);
        environment.set("diffusion", DIFFUSION);
      }
    })
  ]);
}

function run() {
  environment.tick();
  requestAnimationFrame(run);
}

setup();
run();
`;

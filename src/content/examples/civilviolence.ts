export const meta = {
  title: 'Civil Violence',
  description: 'Epstein\'s model of rebellion dynamics, showing how legitimacy and enforcement shape outbreaks of civil unrest.',
  topics: ["Politics","Social Science"],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `This implementation of Joshua Epstein's <a href="https://www.pnas.org/doi/10.1073/pnas.092080199" target="_blank">Civil Violence Model</a> (2002) simulates the emergence of rebellion against a central authority. The model explores how perceived government legitimacy and the risk of arrest interact to produce collective action—or suppress it.

Civilians (gray, red, or white pixels) each have a "grievance" derived from their hardship and the government's legitimacy. When grievance exceeds risk aversion (modulated by the local presence of cops), a civilian becomes "active" (red), openly rebelling. Cops (blue) arrest adjacent active civilians, who then serve a jail term (white). The interplay of these rules generates rich dynamics: high legitimacy and heavy policing produce quiet populations; low legitimacy and sparse enforcement yield near-constant unrest; intermediate values often produce <em>punctuated equilibria</em>—long periods of calm interrupted by sudden outbursts as localized grievances cascade into mass rebellion.
`;

export const code = `import { Environment, CanvasRenderer, Terrain, utils, Colors } from "flocc";
utils.seed(1);

/* ----- PARAMETERS ----- */
const PERCENT_FULL = 0.7;
const PERCENT_COPS = 0.05;
const LEGITIMACY = 0.4;
const JAIL_TERM = 10;

/* ----- SETUP ----- */
const scale = 5;
const [width, height] = [100, 100];
const environment = new Environment({ width, height });
const renderer = new CanvasRenderer(environment, {
  width: width * scale,
  height: height * scale
});
renderer.mount("#container");
const terrain = new Terrain(width, height, { scale, async: true });
environment.use(terrain);

const hardship = new Terrain(width, height, { scale, grayscale: true });
const riskAversion = new Terrain(width, height, { scale, grayscale: true });
const jailTerms = new Terrain(width, height, { scale, grayscale: true });

const EMPTY = Colors.BLACK;
const COP = Colors.BLUE;
const CIVILIAN = { r: 127, g: 127, b: 127, a: 255 };
const ACTIVE = Colors.RED;
const ARRESTED = Colors.WHITE;

function match(p1, p2) {
  return p1.r === p2.r && p1.g === p2.g && p1.b === p2.b && p1.a === p2.a;
}

function getRandomOpenCell() {
  const [x, y] = [utils.random(0, width), utils.random(0, height)];
  if (!match(terrain.sample(x, y), EMPTY)) return getRandomOpenCell();
  return { x, y };
}

function grievance(x, y) {
  return (hardship.sample(x, y) / 255) * (1 - LEGITIMACY);
}

function netRisk(x, y) {
  return (riskAversion.sample(x, y) / 255) * arrestProbability(x, y);
}

function arrestProbability(x, y) {
  const k = 2.302585;

  const visible = terrain.neighbors(x, y);
  let cops = 0;
  let actives = 1; // count self

  for (let i = 0; i < visible.length; i++) {
    if (match(visible[i], COP)) {
      cops++;
    } else if (match(visible[i], ACTIVE)) {
      actives++;
    }
  }

  const copsToActives = cops / actives;
  const result = 1 - Math.pow(Math.E, -k * copsToActives);

  return result;
}

function swap(x1, y1, x2, y2) {
  const [t, h, r, j] = [
    terrain.sample(x1, y1),
    hardship.sample(x1, y1),
    riskAversion.sample(x1, y1),
    jailTerms.sample(x1, y1)
  ];
  terrain.set(x1, y1, terrain.sample(x2, y2));
  hardship.set(x1, y1, hardship.sample(x2, y2));
  riskAversion.set(x1, y1, riskAversion.sample(x2, y2));
  jailTerms.set(x1, y1, jailTerms.sample(x2, y2));
  terrain.set(x2, y2, t);
  hardship.set(x2, y2, h);
  riskAversion.set(x2, y2, r);
  jailTerms.set(x2, y2, j);
}

function tickCivilian(x, y) {
  const here = terrain.sample(x, y);
  const jt = jailTerms.sample(x, y);
  const threshold = 0.5;

  let arrested = match(here, ARRESTED);
  let active = false;

  if (!arrested) {
    active = grievance(x, y) - netRisk(x, y) > threshold;
  } else if (arrested) {
    if (jt === 0) {
      terrain.set(x, y, CIVILIAN);
    } else {
      jailTerms.set(x, y, jt - 1);
      return;
    }
  }

  if (active) terrain.set(x, y, ACTIVE);

  for (let dy of utils.shuffle([-1, 0, 1])) {
    for (let dx of utils.shuffle([-1, 0, 1])) {
      if (dx === 0 && dy === 0) continue;
      const p = terrain.sample(x + dx, y + dy);
      if (!match(p, EMPTY)) continue;
      return swap(x, y, x + dx, y + dy);
    }
  }
}

function tickCop(x, y) {
  const actives = [];
  for (let dy = -1; dy < 1; dy++) {
    for (let dx = -1; dx < 1; dx++) {
      if (match(terrain.sample(x + dx, y + dy), ACTIVE))
        actives.push({ x: x + dx, y: y + dy });
    }
  }

  if (actives.length > 0) {
    const randomArrest = utils.sample(actives);
    terrain.set(randomArrest.x, randomArrest.y, ARRESTED);
    jailTerms.set(randomArrest.x, randomArrest.y, JAIL_TERM);
  }

  for (let dy of utils.shuffle([-1, 0, 1])) {
    for (let dx of utils.shuffle([-1, 0, 1])) {
      if (dx === 0 && dy === 0) continue;
      const p = terrain.sample(x + dx, y + dy);
      if (!match(p, EMPTY)) continue;
      return swap(x, y, x + dx, y + dy);
    }
  }
}

function setup() {
  terrain.init((x, y) => {
    const r = utils.uniform();
    if (r > PERCENT_FULL) {
      return EMPTY;
    } else if (r > (1 - PERCENT_COPS) * PERCENT_FULL) {
      return COP;
    } else {
      hardship.set(x, y, utils.random(0, 255));
      riskAversion.set(x, y, utils.random(0, 255));
      return CIVILIAN;
    }
  });
  terrain.addRule((x, y) => {
    const here = terrain.sample(x, y);
    if (match(here, EMPTY)) return;
    if (match(here, COP)) return tickCop(x, y);
    return tickCivilian(x, y);
  });
}

function run() {
  environment.tick({ randomizeOrder: true });
  setTimeout(run, 100);
}

setup();
run();
`;

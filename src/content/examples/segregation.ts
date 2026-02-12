export const meta = {
  title: 'Segregation',
  description: 'Lorem ipsum',
  topics: ["Social Science"],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `The Schelling Segregation model (1971) demonstrates how group-level patterns can emerge that are disconnected from the intentions of individuals. In this model, agents are represented by individual red or blue pixels on a <code>Terrain</code>. An agent belonging to each group wants to be surrounded by more of its own type than the other, and will move to an empty cell in the environment if it is in the minority.

These agents do not exhibit aversion to other types of agents per se, and only want to find a position in a non-minority group, but the resulting movements deterministically result in a segregated environment — an illustration of how systems-level effects (i.e. systemic bias) can arise unintuitively from lower-level behavior.
`;

export const code = `import { Environment, Terrain, CanvasRenderer, Colors, utils } from "flocc";

/* ---------- PARAMETERS ---------- */
/* -------------------------------- */
// the percentage of neighbors below which
// an agent will move to an open space
const MOVE_THRESHOLD = 0.72;

// how wide the neighborhood an agent should look
// at when considering whether to move or not
// (WARNING! above 5, this greatly slows the
// simulation down)
const NEIGHBOR_RADIUS = 1;

// the percentage of the grid that is open spaces
const PERCENT_EMPTY = 0.1;

// what color the agents are -- if you add a color,
// you will probably have to change MOVE_THRESHOLD
const AGENT_COLORS = [Colors.RED, Colors.BLUE];
/* -------------------------------- */
/* -------------------------------- */

const [width, height] = [600, 600];
const container = document.getElementById("container");
const environment = new Environment({ width, height });
const renderer = new CanvasRenderer(environment, { width, height });
renderer.mount(container);

const terrain = new Terrain(width / 3, height / 3, {
  // because pixels on the terrain have to 'update'
  // their location during each tick, to avoid collisions,
  // we set \`async\` to \`true\`
  async: true,
  scale: 3
});
environment.use(terrain);

const EMPTY = Colors.WHITE;

/**
 * To set up, initialize every pixel on the terrain
 * to be EMPTY at the assigned PERCENT_EMPTY,
 * or a random value from the given AGENT_COLORS
 */
function setup() {
  terrain.init(() => {
    if (Math.random() < PERCENT_EMPTY) return EMPTY;
    return utils.sample(AGENT_COLORS);
  });
}

// helper function for if an agent exists
// at the given (x, y) coordinate
function existsCoord(x, y) {
  return !areSame(terrain.sample(x, y), EMPTY);
}

// helper function for if a given pixel value
// exists (i.e. is not EMPTY)
function existsPixel(px) {
  return !areSame(px, EMPTY);
}

// helper function for if two pixel values
// are the same (= same r/g/b/a values)
function areSame(p1, p2) {
  return p1.r === p2.r && p1.g === p2.g && p1.b === p2.b && p1.a === p2.a;
}

// helper function to find an open space
// on the terrain
function findOpenSpace() {
  let space = null;
  do {
    space = { x: utils.random(0, width), y: utils.random(0, height) };
  } while (existsCoord(space.x, space.y));
  return space;
}

// helper function to swap the pixel values
// of two given coordinates (this is how agents "move")
function swap(x1, y1, x2, y2) {
  const p1 = terrain.sample(x1, y1);
  const p2 = terrain.sample(x2, y2);
  terrain.set(x2, y2, p1);
  terrain.set(x1, y1, p2);
}

terrain.addRule((x, y) => {
  // get the color of the pixel at this coordinate
  const color = terrain.sample(x, y);
  // if there is no agent here, continue on
  if (!existsPixel(color)) return;

  // get the neighbors of this coordinate,
  // but filter to only those that are not empty
  const neighbors = terrain
    .neighbors(x, y, NEIGHBOR_RADIUS, true)
    .filter(existsPixel);

  // then, get the percentage of neighbors who
  // have the same color as the agent at (x, y)
  const percentLike =
    neighbors.filter((n) => areSame(color, n)).length / neighbors.length;
  // in the unlikely event that there aren't any neighbors,
  // assume that the agent is happy here
  if (neighbors.length === 0) return;

  // if the threshold has been met, the agent stays put
  if (percentLike >= MOVE_THRESHOLD) return;

  // otherwise, find an open space and move there
  const open = findOpenSpace();
  if (open) swap(x, y, open.x, open.y);
});

function render() {
  environment.tick({ randomizeOrder: true });
  requestAnimationFrame(render);
}

setup();
render();
`;

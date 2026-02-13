export const meta = {
  title: 'Voting',
  description: 'A spatial model of opinion dynamics where local majorities drive the emergence of polarized regions.',
  topics: ["Politics","Social Science"],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `This model, adapted from Rudy Rucker's <a href="https://www.rudyrucker.com/computersimulationsbook/" target="_blank"><i>Artificial Life Lab</i></a>, simulates how local social pressure can produce large-scale political polarization. Each cell on the grid holds a binary opinion (visualized as black or white). Each tick, a cell surveys its neighbors within a given <code>RADIUS</code>; if a clear supermajority holds the opposite opinion, the cell switches sides.

The result is the spontaneous formation of homogeneous regions—clusters where neighboring cells share the same opinion. As the perception radius increases, these regions grow larger and their boundaries smoother, reflecting how broader social influence can amplify conformity. The model demonstrates a key dynamic in opinion formation: even without strong individual biases, the pressure to align with one's neighbors can drive a population toward spatial segregation of beliefs.
`;

export const code = `import { Environment, Terrain, CanvasRenderer } from "flocc";

const RADIUS = 3;
const width = 500;
const height = 500;

const environment = new Environment({ width, height });
const renderer = new CanvasRenderer(environment, { width, height });
renderer.mount("#container");

const terrain = new Terrain(width, height, { grayscale: true });
environment.use(terrain);

terrain.addRule((x, y) => {
  const neighbors = terrain.neighbors(x, y, RADIUS, true);
  const votesForBlack = neighbors.filter(v => v === 0).length;
  let value;
  if (votesForBlack > neighbors.length / 2 + 1) value = 0;
  if (votesForBlack < neighbors.length / 2 - 1) value = 200;
  return value;
});

function setup() {
  let value = 1;
  const p = 433494437;
  const m = 514229;
  terrain.init(() => {
    value = (m * value) % p;
    return Math.sin(value) > 0 ? 200 : 0;
  });
}

function run() {
  environment.tick();
  setTimeout(run, 50);
}

setup();
run();
`;

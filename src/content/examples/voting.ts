export const meta = {
  title: 'Voting',
  description: 'Lorem ipsum',
  topics: ["Politics","Social Science"],
  tags: ["CanvasRenderer","Terrain"],
};

export const content = `Based on the model described by Rudy Rucker in “Artificial Life Lab” and implemented in NetLogo, this model simulates a voting process and the emergence of polarized opinions. Each agent samples its neighbors within <code>RADIUS</code> and, if there's a clear super-majority with a different vote from the agent, it will change its vote (i.e. bowing to social pressure).

By expanding the <code>RADIUS</code> parameter, regions of agents with the same opinion become larger and more defined.
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

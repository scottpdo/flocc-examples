export const meta = {
  title: 'Diffusion Limited Aggregation',
  description: 'Lorem ipsum',
  topics: ["Artificial Life"],
  tags: ["CanvasRenderer","Flocc UI"],
};

export const content = `In this model, translated from the <a href="https://www.complexity-explorables.org/explorables/particularly-stuck/" target="_blank">Complexity Explorables model “Particularly Stuck”</a> (Janina Schöneberger & Dirk Brockmann), particle-agents move noisily around in space, slowly spiraling toward the center. One particle is already stationary at the center, considered the 'aggregation,' and when other particles collide with it, they become part of a growing, emergent structure. Although the byproduct of random movement, the structure appears to have a fractal logic, branching outward like coral, neurons, or other natural objects.
`;

export const code = `import { Agent, Environment, CanvasRenderer, utils } from "flocc";
import { Button, Panel, Slider } from "flocc-ui";

/* ----- PARAMETERS ----- */
const SPEED = 0.8;
const NOISE = 0.8;
const ATTRACTION = 0.05;
const TWIST = 0.05;
const TWISTMIX = 0.0;
/* ---------------------- */

utils.seed(1);

const [width, height] = [128, 128];
const scale = Math.min(window.innerWidth, window.innerHeight) / 128;
const environment = new Environment({ width, height, torus: false });
const renderer = new CanvasRenderer(environment, {
  width: width * scale,
  height: height * scale,
  origin: { x: -width / 2, y: -height / 2 },
  scale
});
renderer.mount("#container");

environment.set("speed", SPEED);
environment.set("noise", NOISE);
environment.set("attraction", ATTRACTION);
environment.set("twist", TWIST);

const color = (agent) => {
  return agent.get("state") ? "#bbb" : "#000";
};

function addAgent() {
  const agent = new Agent({
    x: utils.random(-width / 2, width / 2),
    y: utils.random(-height / 2, height / 2),
    polarity: utils.uniform(),
    state: true,
    size: scale / 2,
    color
  });
  agent.addRule(tick);
  environment.addAgent(agent);
}

function tick(agent) {
  const { speed, noise, attraction, twist } = environment.getData();
  let { x, y, polarity, state } = agent.getData();
  if (!state) return;
  const P = polarity < TWISTMIX ? 1 : -1;
  const r = utils.distance(agent, { x: 0, y: 0 });
  const dx =
    speed * ((-attraction * x + P * twist * y) / r) +
    noise * utils.random(-0.5, 0.5, true) * Math.sqrt(speed);
  const dy =
    speed * ((-attraction * y - P * twist * x) / r) +
    noise * utils.random(-0.5, 0.5, true) * Math.sqrt(speed);

  x += dx;
  y += dy;

  const statics = environment.memo(() =>
    environment.getAgents().filter((a) => !a.get("state"))
  );
  if (r - 1 < environment.get("radius")) {
    for (let i = 0; i < statics.length; i++) {
      if (utils.distance(agent, statics[i]) < 1) {
        state = false;
        if (r > environment.get("radius")) {
          environment.set("radius", r);
        }
        if (environment.getAgents().length < 2000) addAgent();
        break;
      }
    }
  }

  return {
    x,
    y,
    state
  };
}

function populate() {
  for (let i = 0; i < 300; i++) {
    addAgent();
  }
  const agent = new Agent({
    x: 0,
    y: 0,
    state: false,
    size: scale / 2,
    color
  });
  agent.addRule(tick);
  environment.addAgent(agent);
  environment.set("radius", 0);
}

function UI() {
  new Panel(environment, [
    new Slider({
      name: "speed",
      min: 0.4,
      max: 5
    }),
    new Slider({
      name: "noise",
      min: 0,
      max: 2
    }),
    new Slider({
      name: "attraction",
      min: 0,
      max: 0.5
    }),
    new Slider({
      name: "twist",
      min: -0.25,
      max: 0.25
    }),
    new Button({
      label: "Reset Parameters",
      onClick() {
        environment.set("speed", SPEED);
        environment.set("noise", NOISE);
        environment.set("attraction", ATTRACTION);
        environment.set("twist", TWIST);
      }
    }),
    new Button({
      label: "Reset Environment",
      onClick() {
        while (environment.getAgents().length > 0) {
          const agents = environment.getAgents();
          environment.removeAgent(agents[agents.length - 1]);
        }
        populate();
      }
    })
  ]);
}

function setup() {
  populate();
  UI();
}

function run() {
  environment.tick();
  requestAnimationFrame(run);
}

setup();
run();
`;

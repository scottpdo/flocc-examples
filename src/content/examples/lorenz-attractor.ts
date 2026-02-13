export const meta = {
  title: 'Lorenz Attractor',
  description: 'The iconic butterfly-shaped strange attractor, demonstrating deterministic chaos.',
  topics: ["Physics", "Mathematics"],
  tags: [],
  dependencies: {
    'three': '0.112.0',
    'three-orbit-controls': '82.1.0',
  },
};

export const content = `The <a href="https://en.wikipedia.org/wiki/Lorenz_system" target="_blank">Lorenz system</a>, discovered by meteorologist <a href="https://en.wikipedia.org/wiki/Edward_Norton_Lorenz" target="_blank">Edward Lorenz</a> in 1963, is a set of three coupled differential equations that became foundational to <a href="https://en.wikipedia.org/wiki/Chaos_theory" target="_blank">chaos theory</a>. The system is deterministic—given initial conditions, its future is uniquely determined—yet it exhibits extreme sensitivity: trajectories starting arbitrarily close together diverge exponentially. This is the famous "butterfly effect."

In this visualization, five agents begin at nearly identical positions and evolve according to the Lorenz equations. Initially their paths are indistinguishable, but they soon diverge wildly—after enough time, their positions are effectively uncorrelated. Yet all five remain confined to the same <a href="https://en.wikipedia.org/wiki/Attractor#Strange_attractor" target="_blank">strange attractor</a>, tracing its characteristic butterfly shape. Unlike the agent-based models elsewhere on this site, there is no interaction between agents; complexity arises purely from the nonlinear dynamics of the equations themselves.`;

export const code = `import { Agent, Environment } from "flocc";
import * as THREE from "three";
const OrbitControls = require("three-orbit-controls")(THREE);

const axisGeoX = new THREE.Geometry();
const axisGeoY = new THREE.Geometry();
const axisGeoZ = new THREE.Geometry();

axisGeoX.vertices.push(
  new THREE.Vector3(-10000, 0, 0),
  new THREE.Vector3(10000, 0, 0)
);
axisGeoY.vertices.push(
  new THREE.Vector3(0, -10000, 0),
  new THREE.Vector3(0, 10000, 0)
);
axisGeoZ.vertices.push(
  new THREE.Vector3(0, 0, -10000),
  new THREE.Vector3(0, 0, 10000)
);

const axisMaterial = new THREE.LineDashedMaterial({
  color: 0xffffff,
  linewidth: 1,
  dashSize: 0.06,
  gapSize: 0.06,
  opacity: 0.75,
  transparent: true
});

const axisX = new THREE.Line(axisGeoX, axisMaterial);
const axisY = new THREE.Line(axisGeoY, axisMaterial);
const axisZ = new THREE.Line(axisGeoZ, axisMaterial);

axisX.computeLineDistances();
axisY.computeLineDistances();
axisZ.computeLineDistances();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(-24, 5, -16);
const controls = new OrbitControls(camera);
controls.target.set(-10, 0, 5);
camera.lookAt(new THREE.Vector3(-10, 0, 5));
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000022);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const MAX_POINTS = 5000;

const environment = new Environment();

function createAgent(color) {
  const traceGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(MAX_POINTS * 3);
  let drawCount = 0;
  traceGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  traceGeo.setDrawRange(0, drawCount);
  const traceMaterial = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 0.5,
    color,
    linewidth: 1
  });
  const traceLine = new THREE.Line(traceGeo, traceMaterial);
  scene.add(traceLine);

  const agent = new Agent();
  agent.addRule(tick);
  const agentGeo = new THREE.SphereGeometry(0.5);
  const agentMat = new THREE.MeshBasicMaterial({ color });
  const agentMesh = new THREE.Mesh(agentGeo, agentMat);
  agentMesh.position.set(Math.random(), Math.random(), Math.random());
  agent.set("position", agentMesh.position);
  agent.set("traceLine", traceLine);
  agent.get("x", () => agent.get("position").x);
  agent.get("y", () => agent.get("position").y);
  agent.get("z", () => agent.get("position").z);

  environment.addAgent(agent);
  scene.add(agentMesh);
}

function tick(agent) {
  const { x, y, z } = agent.get("position");
  const { traceLine } = agent.getData();
  const positions = traceLine.geometry.attributes.position.array;
  if (environment.time < MAX_POINTS) {
    positions[3 * environment.time] = x;
    positions[3 * environment.time + 1] = y;
    positions[3 * environment.time + 2] = z;
    traceLine.geometry.attributes.position.needsUpdate = true; // required after the first render
    traceLine.geometry.setDrawRange(0, environment.time);
  }
  const xn = 10 * (y - x);
  const yn = x * (28 - z) - y;
  const zn = x * y - (8 / 3) * z;
  agent.enqueue(() => {
    const t = 0.01;
    agent.get("position").set(x + t * xn, y + t * yn, z + t * zn);
  });
}

function setup() {
  const colors = [0xff3333, 0x9999ff, 0xffff33, 0xffffff, 0x33ffff];
  for (let i = 0; i < 5; i++) {
    createAgent(colors[i]);
  }
  scene.add(axisX);
  scene.add(axisY);
  scene.add(axisZ);
}

function run() {
  renderer.render(scene, camera);
  environment.tick();
  requestAnimationFrame(run);
}

setup();
run();
`;

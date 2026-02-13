export const meta = {
  title: 'Flocking (3D)',
  description: 'Reynolds\' boids algorithm extended into three dimensions, visualized with Three.js.',
  topics: ["Ecology","Physics"],
  tags: ["KDTree"],
  dependencies: {
    'three': '0.117.1',
    'three-orbit-controls': '82.1.0',
  },
};

export const content = `This model extends <a href="https://www.red3d.com/cwr/boids/" target="_blank">Craig Reynolds' boids algorithm</a> into three dimensions, demonstrating that the same local rules—alignment, cohesion, and separation—produce realistic flocking behavior regardless of dimensionality. The visualization uses <a href="https://threejs.org/" target="_blank">Three.js</a> rather than Flocc's built-in renderers, illustrating how Flocc's agent-based logic can integrate with external graphics libraries.

The environment is toroidal: agents exiting one face of the bounding cube reappear on the opposite side, eliminating edge effects and allowing flocks to move continuously through space. Observe how three-dimensional flocking reveals behaviors less apparent in 2D—such as the formation of spherical clusters and corkscrew trajectories—as agents balance the competing demands of staying together, matching velocity, and maintaining personal space.`;

export const code = `import { Agent, Environment, KDTree, utils } from "flocc";
import * as THREE from "three";
const OrbitControls = require("three-orbit-controls")(THREE);

const ALIGNMENT = 1000;
const SEPARATION = 300;
const FLOCK_SIZE = 300;

const WIDTH = 400;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(WIDTH * 1.25, WIDTH * 1.25, WIDTH * 1.5);
camera.lookAt(new THREE.Vector3(WIDTH / 2, WIDTH / 2, WIDTH / 2));
const controls = new OrbitControls(camera);
controls.target.set(WIDTH / 2, WIDTH / 2, WIDTH / 2);
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x333333);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const environment = new Environment();
let tree;

const distanceToMaterial = d => {
  d = utils.clamp(d, 50, 750);
  const index = Math.round(utils.remap(d, 750, 50, 0, 19));
  return materials[index];
};

function tick(agent) {
  const [p, v] = [agent.get("position"), agent.get("velocity")];
  p.add(v);
  if (p.x < 0) p.x += WIDTH;
  if (p.x > WIDTH) p.x -= WIDTH;
  if (p.y < 0) p.y += WIDTH;
  if (p.y > WIDTH) p.y -= WIDTH;
  if (p.z < 0) p.z += WIDTH;
  if (p.z > WIDTH) p.z -= WIDTH;

  let { x, y, z } = p;
  const { mesh } = agent.getData();
  mesh.position.set(x, y, z);
  const toCamera = mesh.position.distanceTo(camera.position);
  mesh.material = distanceToMaterial(toCamera);

  const d = 20;
  const neighbors = tree.agentsWithinDistance(agent, d);
  if (neighbors.length === 0) return;

  const averageVelocity = new THREE.Vector3(0, 0, 0);
  const center = new THREE.Vector3(0, 0, 0);
  for (let i = 0; i < neighbors.length; i++) {
    const neighbor = neighbors[i];
    averageVelocity.add(neighbor.get("velocity"));
    let x = neighbor.get("x");
    let y = neighbor.get("y");
    if (p.x + d > WIDTH && x < d) x += WIDTH;
    if (p.x - d < 0 && x + d > WIDTH) x -= WIDTH;
    if (p.y + d > WIDTH && y < d) y += WIDTH;
    if (p.y - d < 0 && y + d > WIDTH) y -= WIDTH;
    if (p.z + d > WIDTH && z < d) z += WIDTH;
    if (p.z - d < 0 && z + d > WIDTH) z -= WIDTH;
    center.x += x;
    center.y += y;
    center.z += z;
  }
  center.multiplyScalar(1 / neighbors.length);

  const meanVel = neighbors.reduce(
    (a, b) => a.add(b.get("velocity")),
    new THREE.Vector3()
  );
  meanVel.normalize();
  meanVel.multiplyScalar(ALIGNMENT / 100);

  const towardCenter = p
    .clone()
    .add(center.multiplyScalar(-1))
    .multiplyScalar(SEPARATION / 1000);

  v.add(towardCenter);
  v.add(meanVel);
  v.normalize();
}

const materials = new Array(20).fill(0).map((a, i) => {
  return new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: Math.sqrt((i + 1) / 20),
    transparent: true
  });
});

function setup() {
  const agentGeo = new THREE.SphereGeometry(3);
  const agentMaterial = materials[19];

  const geometry = new THREE.BoxBufferGeometry(400, 400, 400);
  const edges = new THREE.EdgesGeometry(geometry);
  const box = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true
    })
  );
  box.position.set(WIDTH / 2, WIDTH / 2, WIDTH / 2);
  scene.add(box);

  for (let i = 0; i < FLOCK_SIZE; i++) {
    const agent = new Agent();
    agent.addRule(tick);
    const position = new THREE.Vector3(
      utils.random(-100, 100),
      utils.random(-100, 100),
      utils.random(-100, 100)
    );
    const velocity = new THREE.Vector3(
      utils.random(-1, 1, true),
      utils.random(-1, 1, true),
      utils.random(-1, 1, true)
    );
    velocity.normalize();
    const mesh = new THREE.Mesh(agentGeo, agentMaterial);
    const { x, y, z } = position;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    agent.set({
      position,
      x: () => position.x,
      y: () => position.y,
      z: () => position.z,
      velocity,
      mesh
    });
    environment.addAgent(agent);
  }

  tree = new KDTree(environment.getAgents(), 3);
  environment.use(tree);
}

function run() {
  renderer.render(scene, camera);
  environment.tick();
  requestAnimationFrame(run);
}

setup();
run();
`;

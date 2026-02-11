export const meta = {
  title: 'Flocking',
  description: 'The classic boids algorithm, demonstrating emergent flocking behavior from three simple rules: alignment, cohesion, and separation.',
};

export const content = `
## About

Flocking is one of the most iconic examples of emergent behavior in complex systems. First described by Craig Reynolds in 1986, the "boids" algorithm shows how realistic flocking patterns emerge from agents following just three simple rules:

1. **Alignment**: Steer towards the average heading of nearby flockmates
2. **Cohesion**: Steer towards the center of mass of nearby flockmates  
3. **Separation**: Avoid crowding nearby flockmates

Each agent has a perception radius within which it considers its neighbors. The balance of these three forces creates the characteristic swirling, organic motion of flocks.

## Try It

Edit the code below to experiment:
- Change \`SPEED\` to make boids faster or slower
- Adjust \`PERCEPTION\` to change how far boids can see
- Modify \`SEPARATION\` to control personal space
- Try changing the number of boids
`;

export const code = `import { Agent, Environment, CanvasRenderer, utils } from 'flocc';

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const width = canvas.width;
const height = canvas.height;

// Parameters - try changing these!
const SPEED = 2;
const PERCEPTION = 50;
const SEPARATION = 25;
const NUM_BOIDS = 100;

const environment = new Environment();

function createBoid() {
  const agent = new Agent();
  agent.set({
    x: utils.random(0, width),
    y: utils.random(0, height),
    vx: utils.random(-SPEED, SPEED),
    vy: utils.random(-SPEED, SPEED),
  });

  agent.set('tick', (a) => {
    const neighbors = environment.getAgents().filter((other) => {
      if (other === a) return false;
      const dx = other.get('x') - a.get('x');
      const dy = other.get('y') - a.get('y');
      return Math.sqrt(dx * dx + dy * dy) < PERCEPTION;
    });

    let vx = a.get('vx');
    let vy = a.get('vy');

    if (neighbors.length > 0) {
      let avgVx = 0, avgVy = 0;
      let avgX = 0, avgY = 0;
      let sepX = 0, sepY = 0;

      neighbors.forEach((n) => {
        avgVx += n.get('vx');
        avgVy += n.get('vy');
        avgX += n.get('x');
        avgY += n.get('y');

        const dx = a.get('x') - n.get('x');
        const dy = a.get('y') - n.get('y');
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SEPARATION && dist > 0) {
          sepX += dx / dist;
          sepY += dy / dist;
        }
      });

      // Alignment
      vx += (avgVx / neighbors.length - vx) * 0.05;
      vy += (avgVy / neighbors.length - vy) * 0.05;
      // Cohesion
      vx += (avgX / neighbors.length - a.get('x')) * 0.005;
      vy += (avgY / neighbors.length - a.get('y')) * 0.005;
      // Separation
      vx += sepX * 0.1;
      vy += sepY * 0.1;
    }

    // Normalize speed
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag > 0) {
      vx = (vx / mag) * SPEED;
      vy = (vy / mag) * SPEED;
    }

    // Wrap at edges
    let x = a.get('x') + vx;
    let y = a.get('y') + vy;
    if (x < 0) x += width;
    if (x > width) x -= width;
    if (y < 0) y += height;
    if (y > height) y -= height;

    a.set({ x, y, vx, vy });
  });

  return agent;
}

for (let i = 0; i < NUM_BOIDS; i++) {
  environment.addAgent(createBoid());
}

const renderer = new CanvasRenderer(environment, {
  canvas,
  background: '#141414',
});

renderer.render = (a, ctx) => {
  const x = a.get('x');
  const y = a.get('y');
  const angle = Math.atan2(a.get('vy'), a.get('vx'));

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-4, 4);
  ctx.lineTo(-4, -4);
  ctx.closePath();
  ctx.fillStyle = '#3b82f6';
  ctx.fill();
  ctx.restore();
};

function loop() {
  environment.tick({ randomizeOrder: true });
  requestAnimationFrame(loop);
}
loop();
`;

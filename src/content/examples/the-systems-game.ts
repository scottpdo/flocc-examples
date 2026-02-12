export const meta = {
  title: 'The Systems Game',
  description: 'Lorem ipsum',
  topics: ["Complex Systems"],
  tags: ["CanvasRenderer","Flocc UI"],
};

export const content = `<a href="https://workthatreconnects.org/resource/the-systems-game/" target="_blank"><i>The Systems Game</i></a>, by Joanna Macy, is played in an open space by a group of people. Each person selects two others in the group and tries to keep an equal distance between them and each of the other two. Physically playing The Systems Game tangibly illustrates many of the dynamics of complex systems — self-regulation through activity, emergent layers of activity (clockwise or counterclockwise group motion), and interdependence of parts.

<a href="https://www.youtube.com/watch?v=o_XRwN7UvIE" target="_blank">See <i>The Systems Game</i> played by a group of Carnegie Mellon University students.</a>

In this computational model of <i>The Systems Game</i>, agents randomly select two others from which to find an equidistant position. By clicking “Show Constraints” and “Next Agent,” you can see the intent behind an agent's movement. If the system reaches a static configuration, clicking “Remove” will randomly remove five agents, and start the system in motion again.`;

export const code = `import { Agent, Environment, CanvasRenderer, utils, Vector } from "flocc";
import { Panel, Button, Slider } from "flocc-ui";

const width = window.innerWidth;
const height = window.innerHeight;
const POPULATION = Math.min(width, height) / 2;

let isShowingConstraints = false;

const environment = new Environment({ width, height, torus: false });
const renderer = new CanvasRenderer(environment, {
  background: "black",
  width,
  height
});
renderer.mount("#container");

environment.set("activeAgent", 0);

const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

class PointSlopeLine {
  constructor(point, slope) {
    this.point = point;
    this.slope = slope;
  }

  closest(point) {
    const c = utils.distance(this.point, point);
    const theta = this.slope - angle(this.point, point);
    const d = c * Math.cos(theta);

    const b = new Vector(
      this.point.x + d * Math.cos(this.slope),
      this.point.y + d * Math.sin(this.slope)
    );

    return b;
  }
}

function tick(agent) {
  const { a1, a2, dir, position, vel } = agent.getData();

  position.x += vel * Math.cos(dir);
  position.y += vel * Math.sin(dir);

  position.x = utils.clamp(position.x, 2, width - 2);
  position.y = utils.clamp(position.y, 2, height - 2);

  const p1 = a1.get("position");
  const p2 = a2.get("position");
  const a = angle(p1, p2) + Math.PI / 2;
  const mid = new Vector((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
  const l = new PointSlopeLine(mid, a);
  const c = l.closest(position);
  const d = utils.distance(agent, c);

  agent.set("dir", angle(position, c));

  if (d > 300) {
    agent.set("vel", 1.25);
  } else if (d > 200) {
    agent.set("vel", 1);
  } else if (d > 100) {
    agent.set("vel", 0.75);
  } else {
    agent.set("vel", 0.5);
  }

  // collision with other agents
  environment.getAgents().forEach((neighbor) => {
    if (neighbor === agent) return;
    if (utils.distance(position, neighbor.get("position")) < 5) {
      const a = angle(position, neighbor.get("position"));
      agent.set("dir", -a);
      neighbor.set("dir", a);
    }
  });

  const activeAgent = environment.getAgents()[environment.get("activeAgent")];
  const activeA1 = activeAgent.get("a1");
  const activeA2 = activeAgent.get("a2");

  return isShowingConstraints
    ? {
        color:
          agent === activeAgent
            ? "yellow"
            : agent === activeA1 || agent === activeA2
            ? "cyan"
            : "white",
        size:
          agent === activeAgent || agent === activeA1 || agent === activeA2
            ? 6
            : 2
      }
    : { color: "white", size: 2 };
}

function assign(agent) {
  let a1, a2;
  do {
    a1 = utils.sample(environment.getAgents());
  } while (a1 === agent);
  do {
    a2 = utils.sample(environment.getAgents());
  } while (a2 === agent && a2 === a1);
  agent.set("a1", a1);
  agent.set("a2", a2);
}

function setup() {
  for (let i = 0; i < POPULATION; i++) {
    const agent = new Agent({
      x(agt) {
        return agt.get("position").x;
      },
      y(agt) {
        return agt.get("position").y;
      },
      color: "white",
      size: 2,
      position: new Vector(Math.random() * width, Math.random() * height),
      dir: 2 * Math.PI * Math.random(),
      vel: 1
    });
    agent.addRule(tick);
    environment.addAgent(agent);
  }
  const agents = environment.getAgents();
  agents.forEach(assign);
}

function UI() {
  new Panel(environment, [
    new Button({
      label: "Show/Hide Constraints",
      onClick() {
        isShowingConstraints = !isShowingConstraints;
      }
    }),
    new Button({
      label: "Remove Agents",
      onClick() {
        for (let i = 0; i < 5; i++) {
          const agent = utils.sample(environment.getAgents());
          if (!agent) return;
          environment.removeAgent(agent);
          environment.getAgents().forEach((a) => {
            const { a1, a2 } = a.getData();
            if (a1 === agent || a2 === agent) assign(a);
          });
        }
      }
    })
    // new Slider({
    //   name: "activeAgent",
    //   min: 0,
    //   max: POPULATION - 1,
    //   step: 1
    // })
  ]);
}

function run() {
  environment.tick();

  const activeAgent = environment.getAgents()[environment.get("activeAgent")];
  const { a1, a2 } = activeAgent.getData();

  if (isShowingConstraints) {
    const { context } = renderer;
    const a = angle(a1.getData(), a2.getData()) + Math.PI / 2;
    const mid = {
      x: (a1.get("x") + a2.get("x")) / 2,
      y: (a1.get("y") + a2.get("y")) / 2
    };

    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.setLineDash([5, 10]);

    context.beginPath();
    context.moveTo(mid.x - 2000 * Math.cos(a), mid.y - 2000 * Math.sin(a));
    context.lineTo(mid.x + 2000 * Math.cos(a), mid.y + 2000 * Math.sin(a));
    context.stroke();
  }

  requestAnimationFrame(run);
}

setup();
UI();
run();
`;

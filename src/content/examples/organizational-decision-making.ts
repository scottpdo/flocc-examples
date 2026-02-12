export const meta = {
  title: 'Organizational Decision Making',
  description: 'Lorem ipsum',
  topics: ["Information Theory"],
  tags: ["CanvasRenderer","LineChartRenderer"],
};

export const content = `This model, outlined in <a href="https://press.princeton.edu/books/paperback/9780691127026/complex-adaptive-systems" target="_blank">Miller & Page's <i>Complex Adaptive Systems</i></a>, represents an organization that makes “decisions” — binary outputs of either “0” or “1” — based on four-bit binary input “problems” (for example, “0110” or “1101”). The organization is structured with three agents, who each make decisions based on two-bit binary inputs (“00,” “01,” “10,” or “11”). They are all initialized with a “decision table” that determines what output they produce for each input. Two of the agents take input directly from the four-bit problem (the first two and the last two digits, respectively), and the third agent takes input from these agents' outputs, outputting the organization's decision.

Since each problem has a “correct” solution, and there are 16 unique problem-solution pairs, it's unlikely that the organization will correctly decide every problem. The organization's baseline (percent of problems it will correctly decide) is displayed at the top, and the line chart updates to show a running tally of the mean percent of problems decided correctly.
`;

export const markup = `
  <h2>Baseline: <span id="baseline"></span></h2>
  <div id="container"></div>
  <div id="chart"></div>`;

export const code = `import { Agent, Environment, LineChartRenderer, utils } from "flocc";

const PROBLEMS = new Array(16).fill(0).map(() => utils.random());
let PROBLEM;

const width = 500;
const height = 250;
let a, b, c;
let canvas, context;

const environment = new Environment();
const chart = new LineChartRenderer(environment, {
  height: 250,
  range: {
    min: -0.1,
    max: 1.1
  }
});
chart.metric("correct", {
  fn: arr => {
    const correct = arr.filter(a => a !== null)[0];
    return correct / environment.time;
  }
});
chart.mount("#chart");

const decisionTable = () => {
  return new Array(4).fill(0).map(() => utils.random());
};

function tick(agent) {
  const { decisionTable, input } = agent.getData();
  const output = Math.random() < decisionTable[input] ? 1 : 0;
  if (agent === a) {
    c.set("input", 2 * output);
  } else if (agent === b) {
    c.increment("input", output);
  }
  agent.set("output", output);
  if (agent === c) {
    agent.set("isCorrect", output === PROBLEMS[parseInt(PROBLEM, 2)]);
    agent.increment("correct", agent.get("isCorrect") ? 1 : 0);
  }
}

function getBaseline() {
  let correct = 0;
  for (let i = 0; i < 16; i++) {
    PROBLEM = utils.zfill(i.toString(2), 4);
    a.set("input", parseInt(PROBLEM.slice(0, 2), 2));
    b.set("input", parseInt(PROBLEM.slice(2, 4), 2));
    tick(a);
    tick(b);
    tick(c);
    if (c.get("isCorrect")) correct++;
  }
  // reset
  c.decrement("correct", correct);
  return Math.round((100 * correct) / 16) + "%";
}

function setup() {
  a = new Agent();
  b = new Agent();
  c = new Agent();
  a.set({ x: 200, y: 125 });
  b.set({ x: 300, y: 125 });
  c.set({ x: 250, y: 50, correct: 0 });
  [a, b, c].forEach(agt => {
    agt.set("decisionTable", decisionTable());
    agt.addRule(tick);
    environment.addAgent(agt);
  });

  document.getElementById("baseline").innerHTML = getBaseline();

  canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  context = canvas.getContext("2d");

  document.getElementById("container").appendChild(canvas);
}

function drawLine(from, to) {
  context.beginPath();
  context.moveTo(from.get("x"), from.get("y"));
  context.lineTo(to.get("x"), to.get("y"));
  context.stroke();
}

function draw() {
  PROBLEM = utils.zfill(utils.random(0, 15).toString(2), 4);
  a.set("input", parseInt(PROBLEM.slice(0, 2), 2));
  b.set("input", parseInt(PROBLEM.slice(2, 4), 2));
  environment.tick();
  context.clearRect(0, 0, width, height);
  context.lineWidth = 2;
  drawLine(a, c);
  drawLine(b, c);
  context.font = "bold 18px sans-serif";
  context.textBaseline = "middle";
  context.textAlign = "center";
  PROBLEM.split("").forEach((char, i) => {
    const x = 50 * i + 175;
    const y = 200;
    const dummy = new Agent();
    dummy.set({ x, y: y - 20 });
    drawLine(dummy, i < 2 ? a : b);
    context.fillStyle = "black";
    context.fillText(char, x, y);
  });
  [a, b, c].forEach(agt => {
    context.fillStyle =
      agt === c ? (c.get("isCorrect") ? "green" : "red") : "white";
    context.beginPath();
    context.arc(agt.get("x"), agt.get("y"), 20, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
    context.fillStyle = agt === c ? "white" : "black";
    context.fillText(agt.get("output"), agt.get("x"), agt.get("y"));
  });
  setTimeout(draw, 100);
}

setup();
draw();
`;

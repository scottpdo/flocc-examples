export const meta = {
  title: 'Controversial Debate and Public Opinion',
  description: 'Lorem ipsum',
  topics: ["Politics","Social Science"],
  tags: ["Flocc UI","LineChartRenderer"],
};

export const content = `<a href="https://arxiv.org/pdf/1909.06483.pdf" target="_blank">This model</a> (Krause, Weyhausen-Brinkmann & Bornholdt, 2019) shows public opinion on an issue on which agents can be for, against, or neutral. With each tick, agents holding non-neutral opinions converse (or debate) with another agent.

If the second has a neutral opinion, there is a baseline 50% chance that the first will convince it of their opinion. However, the first may also repel the second, in which case the second now has the opposite opinion.
If the two have opposite opinions, then there is a chance that the second will doubt its opinion and begin holding a neutral opinion (as if persuaded by a strong argument).
If the two have the same opinion, there is a (pretty slim) chance that the second will doubt its opinion and begin holding a neutral opinion (as if realizing flaws in the supporting argument).
With starting parameters of 0.5 for repel and 0.1 for doubt, public opinion always reaches a 50-50 stalemate, even though initially many more agents are for versus against or neutral. By adjusting the parameters, the dynamics of public opinion can sway, from relatively uncontroversial (one view dominates), to volatile (large swings in which one is the majority opinion), to the stalemate shown below.
`;

export const code = `import { Agent, Environment, utils, LineChartRenderer } from "flocc";
import { Button, Panel, Slider } from "flocc-ui";
utils.seed(1);

const POPULATION = 5000;
const CONVINCE = 0.5;
const REPEL = 0.5;
const DOUBT = 0.1;

const environment = new Environment();
environment.set("convince", CONVINCE);
environment.set("repel", REPEL);
environment.set("doubt", DOUBT);

// this agent is the speaker
function tick(agent) {
  // do not run at time = 0... want to give the
  // line chart renderer time to plot initial opinions
  if (environment.time === 0) return;

  const { convince, repel, doubt } = environment.getData();

  const { opinion } = agent.getData();
  // if an agent is neutral, it will neither convince nor
  // repel any other agent from their opinion
  if (opinion === 0) return;

  // find another agent
  let other;
  do {
    other = utils.sample(environment.getAgents());
  } while (other === agent);

  const otherOpinion = other.get("opinion");

  const r = utils.uniform();

  // If the other is undecided...
  if (otherOpinion === 0) {
    // Then \`convince\` % of the time, this agent
    // will convince them to join their side
    if (r < convince) {
      other.set("opinion", opinion);
    }
    // However, it is also possible for this agent
    // to repel them to the other side
    else if (r < convince + convince * repel) {
      other.set("opinion", -1 * opinion);
    }
  }
  // If the other holds the opposite opinion of this agent,
  // then a small percentage of the time, this agent will
  // convince them to become neutral (crossing sides directly
  // is not possible)
  else if (opinion !== otherOpinion) {
    if (r < convince * doubt) other.set("opinion", 0);
  }
  // If the two hold the same opinion, then it is also possible
  // for this agent to make the other neutral (as if they've just
  // realized a flaw in the argument for their opinion)
  else {
    if (r < convince * doubt * repel) other.set("opinion", 0);
  }
}

function setup() {
  environment.time = 0;
  environment.clear();
  for (let i = 0; i < POPULATION; i++) {
    const agent = new Agent({
      opinion: utils.sample([-1, 0, 1], [1, 1, 4])
    });
    agent.addRule(tick);
    environment.addAgent(agent);
  }
}

function ui() {
  new Panel(environment, [
    new Slider({
      name: "doubt"
    }),
    new Slider({
      name: "repel"
    }),
    new Button({
      label: "Reset",
      onClick() {
        setup();
        ui();
      }
    })
  ]);

  const chart = new LineChartRenderer(environment, {
    autoScale: true
  });
  chart.metric("opinion", {
    color: "blue",
    fn(arr) {
      return arr.filter((o) => o === 1).length / POPULATION;
    }
  });
  chart.metric("opinion", {
    color: "red",
    fn(arr) {
      return arr.filter((o) => o === -1).length / POPULATION;
    }
  });
  chart.metric("opinion", {
    color: "green",
    fn(arr) {
      return arr.filter((o) => o === 0).length / POPULATION;
    }
  });
  chart.mount("#container");
}

function run() {
  environment.tick({ randomizeOrder: true });
  if (environment.time < 1200) requestAnimationFrame(run);
}

setup();
ui();
run();
`;

export const meta = {
  title: 'Language Evolution',
  description: 'Agents bootstrapping a shared vocabulary through grounded communication games.',
  topics: ["Linguistics","Social Science"],
  tags: ["LineChartRenderer"],
};

export const style = `body {
  font-family: sans-serif;
}

*,
*:before,
*:after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

#container {
  display: flex;
}

td {
  padding: 5px 10px;
  white-space: pre;
}

/* thanks to https://css-tricks.com/the-shapes-of-css/ */
.triangle {
  width: 0;
  height: 0;
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  border-bottom: 50px solid;
}

.triangle:after {
  transform: translateX(-25px);
}

.circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.square {
  width: 50px;
  height: 50px;
}

.shape {
  display: inline-block;
  vertical-align: middle;
  margin: 25px;
  position: relative;
}

.shape--selected:after {
  position: absolute;
  top: -5px;
  left: -5px;
  height: 60px;
  width: 60px;
  content: "";
  display: block;
  border: 2px dashed black;
}

#guessing {
  text-align: center;
  font-size: 20px;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  padding: 40px 0;
}
`;

export const content = `This model, based on Luc Steels and Frédéric Kramer's <a href="https://ai.vub.ac.be/sites/default/files/steels-ground1999.pdf" target="_blank"><i>Bootstrapping Grounded Word Semantics</i></a> (1999), shows how a shared language can emerge from scratch through <a href="https://en.wikipedia.org/wiki/Language_game_(philosophy)" target="_blank">language games</a>. Agents begin with no common vocabulary. Each turn, a "speaker" indicates a unique object from a set of three; a "listener" guesses the intended <em>meaning</em> (a distinguishing feature like "blue" or "circle") and offers a word for it. If the word matches the speaker's intention, the word-meaning association is reinforced in both agents' lexicons.

Starting from random word generation, agents gradually converge on a shared vocabulary that enables successful communication. Despite the model's simplicity, it produces emergent linguistic phenomena observed in natural languages: <em>synonymy</em> (multiple words for the same meaning), <em>dialectal variation</em> (subgroups developing their own usage), and <em>context-sensitivity</em> (words acquiring narrow or context-dependent meanings). The model contributes to the field of <a href="https://en.wikipedia.org/wiki/Evolutionary_linguistics" target="_blank">evolutionary linguistics</a>, illustrating how cultural conventions can arise without central design.
`;

export const markup = `<div id="guessing"></div>
  <h3>Correct guesses per round:</h3>
  <div id="chart"></div>
  <div>
    <input type="checkbox" id="toggle-dictionary" /><label
      for="toggle-dictionary"
      >Show Dictionary</label
    >
  </div>
  <div>
    <input type="checkbox" checked id="visualize-guessing" /><label
      for="visualize-guessing"
      >Visualize Guessing</label
    >
  </div>
  <div id="container"></div>`;

export const code = `import { Agent, Environment, LineChartRenderer, utils } from "flocc";

const POPULATION = 30;
const MUTATION_RATE = 0.005;

let SHOW_DICTIONARY = false;
let VISUALIZE_GUESSING = true;
let timeout = null;

const colors = ["red", "blue", "green", "yellow", "black", "gray"];
const shapes = ["circle", "square", "triangle"];

const objects = colors
  .map(color => shapes.map(shape => ({ color, shape })))
  .reduce((a, b) => a.concat(b));

const tokens = ["a", "i", "u", "e", "o"]
  .map(v => ["k", "g", "s", "t", "n", "h", "b", "p", "m", "r"].map(c => c + v))
  .reduce((acc, cur) => acc.concat(cur));

class Lexicon {
  constructor() {
    this.associations = [];
  }

  addAssociation(word, meaning) {
    // don't overwrite any existing associations
    if (
      this.associations.find(a => {
        return a.word === word && a.meaning === meaning;
      })
    ) {
      return;
    }
    this.associations.push({ word, meaning, score: 1 });
  }

  adjustAssociation(word, meaning, adjust) {
    const association = this.associations.find(a => {
      return a.word === word && a.meaning === meaning;
    });
    if (!association) return this.addAssociation(word, meaning);
    association.score += adjust;
  }
}

const environment = new Environment();
const chart = new LineChartRenderer(environment, {
  autoScale: true,
  height: 200,
  width: 400,
  range: {
    max: 1.1,
    min: -0.1
  }
});
chart.metric("correct", {
  fn: arr => utils.sum(arr) / POPULATION
});
chart.mount("#chart");

/**
 * Generate a random 2-3 syllable word taken from the tokens
 */
function randomWord() {
  return new Array(utils.random(2, 3))
    .fill(0)
    .map(() => utils.sample(tokens))
    .join("");
}

function numToOrdinal(n) {
  n++;
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return n + "th";
}

/**
 * Given a "topic" (an object with a color, shape, and position)
 * in a "context" (a group of objects), generate the most likely "meaning"
 * -- either the color, shape, or position of the topic
 */
function meaningFromTopicAndContext(topic, context) {
  let meaning;
  const numSameColor =
    context.filter(obj => obj.color === topic.color).length - 1;
  const numSameShape =
    context.filter(obj => obj.shape === topic.shape).length - 1;
  if (numSameColor > 0 && numSameShape > 0) {
    // if there are more than one of the same color and of the same shape,
    // meaning is the topic's position in the context
    meaning = numToOrdinal(context.indexOf(topic));
  } else {
    if (numSameColor === 0 && numSameShape === 0) {
      // meaning is totally ambiguous, randomly pick one
      // with bias toward the position in list
      meaning = utils.sample(
        [numToOrdinal(context.indexOf(topic)), topic.color, topic.shape],
        [2, 1, 1]
      );
    } else if (numSameColor === 0) {
      meaning = topic.color;
    } else {
      meaning = topic.shape;
    }
  }
  return meaning;
}

/**
 * Given a "meaning" (i.e. "triangle," "blue," or 0, 1, 2, ...)
 * retrieve a word if a good candidate exists, or generate a new one
 */
function wordFromMeaning(agent, meaning) {
  const { lexicon } = agent.getData();
  const associations = lexicon.associations.filter(a => a.meaning === meaning);
  let word;
  if (associations.length === 0) {
    word = randomWord();
    lexicon.addAssociation(word, meaning);
  } else {
    let bestGuess = -Infinity;
    let bestWords = [];
    associations.forEach(a => {
      if (a.score > bestGuess) {
        bestGuess = a.score;
        bestWords = [a.word];
      } else if (a.score === bestGuess) {
        bestWords.push(a.word);
      }
    });
    if (bestWords.length === 0 || Math.random() < MUTATION_RATE) {
      word = randomWord();
      lexicon.addAssociation(word, meaning);
    } else {
      word = utils.sample(bestWords);
    }
  }
  return word;
}

function wordFromContext(agent, topic, context) {
  const meaning = meaningFromTopicAndContext(topic, context);
  const word = wordFromMeaning(agent, meaning);
  return [word, meaning];
}

function tick(agent) {
  let guesser;
  do {
    guesser = utils.sample(environment.getAgents());
  } while (guesser === agent);

  // select an object
  const context = utils.shuffle(objects).slice(0, 3);
  const topic = utils.sample(context);
  const [word, meaning] = wordFromContext(agent, topic, context);
  const [guess, guessMeaning] = wordFromContext(guesser, topic, context);

  agent.set("context", context);
  agent.set("topic", topic);
  agent.set("word", word);
  agent.set("meaning", meaning);
  agent.set("guess", guess);
  agent.set("guessMeaning", guessMeaning);

  const { lexicon } = guesser.getData();
  if (word === guess) {
    agent.set("correct", 1);
    lexicon.adjustAssociation(guess, guessMeaning, 1);
  } else if (word !== guess) {
    agent.set("correct", 0);
    lexicon.adjustAssociation(guess, guessMeaning, -1);
    lexicon.adjustAssociation(word, guessMeaning, 1);
  }
}

function setup() {
  for (let i = 0; i < POPULATION; i++) {
    const agent = new Agent({
      lexicon: new Lexicon()
    });
    agent.addRule(tick);
    environment.addAgent(agent);
  }
}

function renderDictionary(container) {
  container.innerHTML = "";
  const table2 = document.createElement("table");
  const dictionary = [];
  const allLexicons = [];
  environment.getAgents().forEach(agent => {
    const { lexicon } = agent.getData();
    lexicon.associations.forEach(a => {
      if (!dictionary.includes(a.word)) dictionary.push(a.word);
      allLexicons.push(a);
    });
  });
  // console.log("dictionary", dictionary.length);
  const allAssociations = dictionary.map(word => {
    const associations = allLexicons.filter(a => a.word === word);
    const meanings = [...new Set(associations.map(a => a.meaning))];
    const scores = [];
    meanings.forEach((meaning, i) => {
      scores[i] = associations
        .filter(a => a.meaning === meaning)
        .reduce((a, b) => a + b.score, 0);
    });
    return {
      word,
      meanings,
      scores
    };
  });
  allAssociations.sort((a, b) => utils.max(b.scores) - utils.max(a.scores));
  allAssociations.slice(0, 20).forEach(a => {
    const row = document.createElement("tr");
    row.innerHTML += \`<td>\${a.word}</td><td>\${a.meanings.join("\\n")}</td><td>\${a.scores.join("\\n")}</td>\`;
    table2.appendChild(row);
  });
  container.appendChild(table2);
}

function draw(container, object, isSelected) {
  const background = object.shape === "triangle" ? "transparent" : object.color;
  container.innerHTML += \`<span style="color: \${
    object.color
  }; background-color: \${background}" class="shape \${
    isSelected ? "shape--selected" : ""
  } \${object.shape}"></span>\`;
}

function visualize(
  container,
  { topic, context, word, meaning, guess, guessMeaning }
) {
  container.innerHTML = "";
  context.forEach((obj, i) => draw(container, obj, obj === topic));
  const div = document.createElement("div");
  div.innerHTML += \`&nbsp;Speaker: "\${word}" (\${meaning})<br />&nbsp;\`;
  container.appendChild(div);
  setTimeout(() => {
    div.innerHTML += \`Guesser: "\${guess}" (\${guessMeaning})\`;
    timeout = null;
  }, 1000);
}

function run() {
  environment.tick();
  if (SHOW_DICTIONARY) renderDictionary(document.getElementById("container"));
  if (VISUALIZE_GUESSING) {
    visualize(
      document.getElementById("guessing"),
      environment.getAgents()[0].getData()
    );
    timeout = setTimeout(run, 2500);
  } else {
    if (environment.time < 1000) requestAnimationFrame(run);
  }
}

document.getElementById("toggle-dictionary").addEventListener("change", () => {
  SHOW_DICTIONARY = document.getElementById("toggle-dictionary").checked;
  if (!SHOW_DICTIONARY) document.getElementById("container").innerHTML = "";
  if (environment.time >= 1000) run();
});

document.getElementById("visualize-guessing").addEventListener("change", () => {
  VISUALIZE_GUESSING = document.getElementById("visualize-guessing").checked;
  if (!VISUALIZE_GUESSING) document.getElementById("guessing").innerHTML = "";
  if (timeout) {
    clearTimeout(timeout);
    run();
  }
});

setup();
run();
`;

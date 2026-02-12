export const meta = {
  title: 'Mandelbrot Set Explorer',
  description: 'Lorem ipsum',
  topics: ["Mathematics"],
  tags: ["CanvasRenderer","Terrain"],
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
  overflow: hidden;
}

body {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
}

#controls {
  position: fixed;
  top: 20px;
  right: 20px;
}

#controls button {
  appearance: none;
  cursor: pointer;
  font-size: 20px;
  color: #fff;
  background: #333;
  border: 1px solid #666;
  border-radius: 0;
  width: 26px;
  display: block;
  margin-bottom: 10px;
}
`;

export const markup = `<div id="container"></div>
  <div id="controls">
    <button id="plus">+</button>
    <button id="minus">&ndash;</button>
  </div>`;

export const content = `This model visualizes the <a href="https://en.wikipedia.org/wiki/Mandelbrot_set" target="_blank">Mandelbrot set</a>, a mathematical construct. The set consists of a relatively simple formula that results in complex fractal patterns when visualized with a <code>Terrain</code>. Each coordinate represents a complex number, with the x-value corresponding to the real component and y the imaginary component.

Use the buttons and drag the canvas to explore how the Mandelbrot set exhibits self-similarity (fractals) at different scales and at different boundary areas.
`;

export const code = `import {
  Environment,
  CanvasRenderer,
  Vector,
  Terrain,
  utils,
  Colors
} from "flocc";

let [width, height] = [window.innerWidth, window.innerHeight];
let scale = (Math.max(width, height) / 220) | 0;
while (width % scale !== 0) width++;
while (height % scale !== 0) height++;
const aspect = width / height;
const environment = new Environment({ width, height });
const renderer = new CanvasRenderer(environment, { width, height });
environment.use(renderer);
renderer.mount("#container");
const terrain = new Terrain(width / scale, height / scale, { scale });
environment.use(terrain);

let zoom = 0.333;
let pressedPlus = false;
let pressedMinus = false;
let isMouseDown = false;
const center = new Vector(-0.75, 0);
const MAX_ITERS = 24;

function mandelbrot(cx, cy, max_iters) {
  if (testBulb(cx, cy) || testCardioid(cx, cy)) return max_iters;
  let i,
    xs = cx * cx,
    ys = cy * cy,
    x = cx,
    y = cy;
  for (i = 0; i < max_iters && xs + ys < 4; i++) {
    let x0 = x;
    x = xs - ys + cx;
    y = 2 * x0 * y + cy;
    xs = x * x;
    ys = y * y;
  }
  return i;
}

function testCardioid(x, y) {
  const a = x - 1 / 4;
  const q = a * a + y * y;
  return q * (q + a) <= 0.25 * y * y;
}

function testBulb(x, y) {
  const a = x + 1;
  return a * a + y * y <= 1 / 16;
}

function real(x) {
  return (x / (width / scale) - 0.5) / zoom + center.x;
}

function imaginary(y) {
  return (y / (height / scale) - 0.5) / (aspect * zoom) + center.y;
}

function match(p1, p2) {
  return p1.r === p2.r && p1.g === p2.g && p1.b === p2.b && p1.a === p2.a;
}

const { FUCHSIA, LIME } = Colors;

function mandelbrotToColor(m) {
  const map = key => {
    return utils.remap(
      m,
      m < MAX_ITERS / 2 ? 0 : MAX_ITERS / 2,
      m < MAX_ITERS / 2 ? MAX_ITERS / 2 : MAX_ITERS,
      m < MAX_ITERS / 2 ? 0 : LIME[key],
      m < MAX_ITERS / 2 ? LIME[key] : FUCHSIA[key]
    );
  };
  return {
    r: map("r"),
    g: map("g"),
    b: map("b"),
    a: 255
  };
}

function setup() {
  terrain.addRule((x, y) => {
    let output = { r: 0, g: 0, b: 0, a: 255 };
    let iters = 1;
    do {
      const m = mandelbrot(real(x), imaginary(y), iters);
      const px = mandelbrotToColor(m);
      // if it has not converged, set new output
      if (!match(output, px)) {
        output = px;
      } else {
        return px;
      }
      iters++;
    } while (iters < MAX_ITERS);
    return output;
  });
}

function run() {
  environment.tick();
  if (pressedPlus) {
    zoom *= 1.15;
  } else if (pressedMinus) {
    zoom /= 1.15;
  }
  requestAnimationFrame(run);
}

setup();
run();

window.addEventListener("mousedown", e => {
  if (e.target.id === "plus") {
    pressedPlus = true;
  } else if (e.target.id === "minus") {
    pressedMinus = true;
  } else {
    isMouseDown = true;
  }
});

function reset() {
  pressedPlus = false;
  pressedMinus = false;
  isMouseDown = false;
}

window.addEventListener("mouseup", reset);
window.addEventListener("mouseleave", reset);
window.addEventListener("blur", reset);

window.addEventListener("mousemove", e => {
  if (!isMouseDown) return;
  center.x -= e.movementX / (width * zoom);
  center.y -= e.movementY / (height * zoom);
});
`;

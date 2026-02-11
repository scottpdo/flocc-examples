# Flocc Examples

Interactive examples for [Flocc](https://github.com/scottpdo/flocc), an agent-based modeling library for JavaScript.

## Development

```bash
npm install
npm run dev
```

## Adding Examples

1. Create a new file in `src/content/examples/` (e.g., `my-example.ts`)
2. Export `meta`, `content`, and `code`:

```typescript
export const meta = {
  title: 'My Example',
  description: 'A brief description for the gallery.',
};

export const content = `
## About

Markdown-like content describing your example.
`;

export const code = `
import { Agent, Environment, CanvasRenderer } from 'flocc';

// Your example code here...
`;
```

3. Add a screenshot to `public/examples/my-example.png`
4. Add the example to the gallery in `src/pages/examples/index.astro`

## Building

```bash
npm run build
```

Output goes to `dist/`.

## Deployment

The site is static and can be deployed to any static host (Netlify, Vercel, GitHub Pages, etc.).

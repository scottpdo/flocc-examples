import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from '@codesandbox/sandpack-react';

interface Props {
  code: string;
  markup?: string;
  title?: string;
  style?: string;
  dependencies?: Record<string, string>;
}

export default function SandpackExample({ code, markup, style, dependencies = {} }: Props) {
  const files = {
    '/index.js': code,
    '/index.html': `<!DOCTYPE html>
<html>
  <body>
    <style>html, body { margin: 0; padding: 0; } #container { height: 100%; width: 100%; display: flex; align-items: center; justify-content: center; } ${style ?? ''}</style>
    ${markup ?? `<div id="container"></div>`}
    <script type="module" src="/index.js"></script>
  </body>
</html>`,
  };

  // Merge default dependencies with example-specific ones
  const allDependencies = {
    flocc: 'latest',
    'flocc-ui': 'latest',
    ...dependencies,
  };

  // Retro Windows 95 inspired theme
  return (
    <div className="sandpack-wrapper">
      <SandpackProvider
        template="vanilla"
        files={files}
        customSetup={{
          dependencies: allDependencies,
        }}
        options={{
          externalResources: [],
          recompileMode: 'delayed',
          recompileDelay: 500,
        }}
        theme={{
          colors: {
            surface1: '#000080',      // Navy blue background
            surface2: '#000060',      // Darker navy
            surface3: '#0000a0',      // Lighter navy
            clickable: '#c0c0c0',     // Gray
            base: '#00ff00',          // Green text (classic terminal)
            disabled: '#808080',
            hover: '#ffffff',
            accent: '#00ff00',        // Green accent
            error: '#ff0000',
            errorSurface: '#400000',
          },
          syntax: {
            plain: '#00ff00',         // Green
            comment: { color: '#808080', fontStyle: 'italic' },
            keyword: '#ffff00',       // Yellow
            tag: '#00ffff',           // Cyan
            punctuation: '#c0c0c0',   // Gray
            definition: '#ffffff',    // White
            property: '#00ffff',      // Cyan
            static: '#ff00ff',        // Magenta
            string: '#ff8000',        // Orange
          },
          font: {
            body: '"IBM Plex Mono", "Courier New", monospace',
            mono: '"IBM Plex Mono", "Courier New", monospace',
            size: '15px',
            lineHeight: '1.5',
          },
        }}
      >
        <SandpackLayout>
          <SandpackCodeEditor
            showLineNumbers
            showTabs={false}
            style={{ height: 500, minHeight: 500 }}
          />
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: 500, minHeight: 500 }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

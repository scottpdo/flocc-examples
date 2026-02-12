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
            surface1: '#141414',
            surface2: '#1e1e1e',
            surface3: '#2a2a2a',
            clickable: '#888',
            base: '#e5e5e5',
            disabled: '#555',
            hover: '#e5e5e5',
            accent: '#3b82f6',
            error: '#ef4444',
            errorSurface: '#2d1515',
          },
          syntax: {
            plain: '#e5e5e5',
            comment: { color: '#6a9955', fontStyle: 'italic' },
            keyword: '#569cd6',
            tag: '#569cd6',
            punctuation: '#808080',
            definition: '#dcdcaa',
            property: '#9cdcfe',
            static: '#4ec9b0',
            string: '#ce9178',
          },
          font: {
            body: '"Inter", system-ui, sans-serif',
            mono: '"JetBrains Mono", monospace',
            size: '14px',
            lineHeight: '1.6',
          },
        }}
      >
        <SandpackLayout>
          <SandpackCodeEditor
            showLineNumbers
            showTabs={false}
            style={{ height: 500 }}
          />
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: 500 }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from '@codesandbox/sandpack-react';

interface Props {
  code: string;
  title?: string;
}

export default function SandpackExample({ code, title }: Props) {
  const files = {
    '/index.js': code,
    '/index.html': `<!DOCTYPE html>
<html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #141414; overflow: hidden; }
      canvas { display: block; }
    </style>
  </head>
  <body>
    <canvas id="canvas"></canvas>
    <script type="module" src="/index.js"></script>
  </body>
</html>`,
  };

  return (
    <div className="sandpack-wrapper">
      <SandpackProvider
        template="vanilla"
        files={files}
        customSetup={{
          dependencies: {
            flocc: 'latest',
          },
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
            style={{ height: '500px' }}
          />
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: '500px' }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

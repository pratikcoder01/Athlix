const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

function loadPreview() {
  const filename = path.resolve(__dirname, '../src/components/landing/KataTelemetryPreview.tsx');
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  const component = new Module(filename, module);
  component.filename = filename;
  component.paths = Module._nodeModulePaths(path.dirname(filename));
  component._compile(result.outputText, filename);
  return component.exports.default;
}

test('the actual telemetry preview server-renders its accessible SVG title', () => {
  const markup = renderToStaticMarkup(React.createElement(loadPreview()));
  assert.equal(/<title[^>]*>(.*?)<\/title>/.exec(markup)?.[1], 'Guard sample: illustrative two-dimensional pose',
    'Server markup must contain the same nonempty title that the client hydrates');
});

test('illustrative SVG paths are stable across last-bit trigonometric differences', () => {
  const Preview = loadPreview();
  const paths = () => [...renderToStaticMarkup(React.createElement(Preview)).matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(match => match[1]);
  const baseline = paths();
  assert.equal(baseline.length, 3);
  const originalCos = Math.cos;
  try {
    // Model the tiny Node/Chromium difference observed in development hydration.
    Math.cos = value => originalCos(value) + Number.EPSILON * 4;
    assert.deepEqual(paths(), baseline, 'The same diagram must serialize identically across runtimes');
  } finally {
    Math.cos = originalCos;
  }
});

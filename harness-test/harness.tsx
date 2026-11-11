import React from 'react';
import { createRoot } from 'react-dom/client';
import ResumeEditView from '../src/components/ResumeEditView';

const lines = Array.from({ length: 160 }, (_, i) => {
  const kind = i % 3;
  if (kind === 0) return `<div class="entry">`;
  if (kind === 1) return `  <span class="role">Role ${i} with some longer text to force wrapping on narrow panes</span>`;
  return `  <span class="dates">2020 – Present</span>`;
});
const longHtml =
  '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n</head>\n<body>\n' +
  '<h1 class="name">Saurav</h1>\n' +
  lines.join('\n') +
  '\n</body>\n</html>';

const resume = {
  _id: 'harness',
  title: 'Saurav — Resume',
  description: 'Auto-generated from profile',
  html: longHtml,
};

try {
  createRoot(document.getElementById('root')!).render(
    <ResumeEditView resume={resume as never} onBack={() => {}} onSave={async () => {}} />,
  );
} catch (e) {
  document.body.innerHTML = '<pre>ERR\n' + String((e as Error).stack || e) + '</pre>';
}

import { cp, mkdir, rm } from 'node:fs/promises';

const outputDir = new URL('../www/', import.meta.url);
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
for (const filename of ['index.html', 'grammar.html', 'styles.css', 'app.js']) {
  await cp(new URL(`../${filename}`, import.meta.url), new URL(filename, outputDir));
}

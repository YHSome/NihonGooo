import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

const outputDir = new URL('../www/', import.meta.url);
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
for (const filename of ['index.html', 'grammar.html', 'styles.css', 'app.js', 'grammar.js']) {
  await cp(new URL(`../${filename}`, import.meta.url), new URL(filename, outputDir));
}
const kuromojiOutput = new URL('node_modules/kuromoji/', outputDir);
await mkdir(kuromojiOutput, { recursive: true });
await mkdir(new URL('build/', kuromojiOutput), { recursive: true });
await cp(new URL('../node_modules/kuromoji/build/kuromoji.js', import.meta.url), new URL('build/kuromoji.js', kuromojiOutput));
const browserLoader = new URL('build/kuromoji.js', kuromojiOutput);
const loaderSource = await readFile(browserLoader, 'utf8');
await writeFile(browserLoader, loaderSource.replaceAll('.dat.gz', '.dat.gz.bin'));

const dictionarySource = new URL('../node_modules/kuromoji/dict/', import.meta.url);
const dictionaryOutput = new URL('dict/', kuromojiOutput);
await mkdir(dictionaryOutput, { recursive: true });
for (const entry of await readdir(dictionarySource, { withFileTypes: true })) {
  if (entry.isFile()) {
    await cp(new URL(entry.name, dictionarySource), new URL(`${entry.name}.bin`, dictionaryOutput));
  }
}

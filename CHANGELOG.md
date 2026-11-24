# Changelog

## 0.5.0

Errors are now always reported, never thrown or swallowed. **This is a breaking change** for code that relied on the
old behaviour:

- Invalid options (unknown `exporter`, `packer`, `packerMethod`, `filter`, unsupported `textureFormat`) were thrown
  synchronously. They are now passed to the callback of `texturePacker()` and reject the promise of `packAsync()`,
  so a surrounding `try/catch` no longer sees them.
- Images that could not be decoded used to be skipped (only `console.error` was called) and the atlas was written
  without them. The run now fails with `Cannot read N image(s): ...` and nothing is packed.
- When no image could be decoded, or the list of images was empty, the callback was never called and the promise
  never settled. Both are now errors (`Cannot read ...`, `No images to pack`).
- An unknown `exporter` failed with `TypeError: Cannot read properties of null`; it now says
  `free-tex-packer-core: Unknown exporter <name>`.
- The `images` argument must be an array.

The published package no longer contains the tests (`files` in package.json).

Output for valid input is byte-identical to 0.4.0.

## 0.4.0

- XML and Starling exporters: the `<?xml ...?>` declaration is the first line, so strict XML parsers accept the files.
- The generator link written into the exported files (`meta.app`, header comments) uses https.
- Requires Node.js 20.9 or newer (`sharp`); dependencies updated (`sharp` 0.35.5, `jimp` 1.7, `tinify` 1.9).

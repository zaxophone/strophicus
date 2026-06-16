# Vendored exsurge

`exsurge.js` is the **non-minified dev build** of the actively maintained
fork [`bbloomf/exsurge`](https://github.com/bbloomf/exsurge) (v1.24.2).

Why vendored instead of an npm dependency:
- The only version of `exsurge` on npm is `0.0.0` (a 2016 build) whose
  production minification tree-shakes away neume classes (`Punctum`, `Ancus`,
  …), causing runtime `"X is not defined"` errors on ~30% of GregoBase chants.
- `bbloomf/exsurge` fixes these but is not published to npm and does not commit
  its `dist/`.

## Rebuild
```
git clone https://github.com/bbloomf/exsurge.git
cd exsurge && yarn install && yarn build-dev   # NOT `yarn build` (minified build drops classes)
cp dist/exsurge.js <this dir>/exsurge.js
```

API used: `Gabc.createMappingsFromSource(ctxt, gabc)` ->
`new ChantScore(ctxt, mappings, true)` -> `performLayout` ->
`layoutChantLines(ctxt, width, cb)` -> `score.createSvg(ctxt)`.

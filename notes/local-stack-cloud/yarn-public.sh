# Runs inside a throwaway container: install the monolith's public npm packages into the
# stack's node_modules volume, from a copy of package.json without the @gapartners packages.
set -euo pipefail
mkdir -p /work && cd /work
cp /src/package.json /src/.yarnrc.yml . && mkdir -p .yarn && cp -r /src/.yarn/releases .yarn/
node -e '
const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json"));
for (const k of ["dependencies","devDependencies","optionalDependencies","peerDependencies","resolutions"]) {
  if (!p[k]) continue; for (const n of Object.keys(p[k])) if (n.startsWith("@gapartners/")) delete p[k][n]; }
fs.writeFileSync("package.json", JSON.stringify(p,null,2));'
sed -i '/npmScopes/,$d' .yarnrc.yml; echo 'yarnPath: .yarn/releases/yarn-4.3.1.cjs' >> .yarnrc.yml
export YARN_ENABLE_IMMUTABLE_INSTALLS=0 YARN_ENABLE_GLOBAL_CACHE=1
yarn install --mode=skip-build 2>&1 | tail -15

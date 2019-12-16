import { read } from "../../internal/input";
import getConfig from "../../internal/config";
import { resolve } from "path";
import outboard, { tagMap } from "outboard";
import { dirname, basename } from "path";
import { cp, writeFile } from "../../internal/util";
import {
  templatePath,
  outputPath,
  copyOverrides,
  watchTemplate
} from "./common";
import { merge } from "lodash";
import chokidar from "chokidar";
import { timeSpinner } from "./common";

const defaultTemplate = resolve(__dirname, "../templates/winter/index.html");
const defaultConfig = {
  overrides: {},
  playground: { enabled: false },
  optimized: false,
  basePath: "/"
};

export default async function(input, cmd, { watch }) {
  const { html: htmlConfig } = await getConfig(cmd.config);

  const config = merge(defaultConfig, htmlConfig);

  const tplFile = templatePath(cmd, defaultTemplate);
  const tplDir = dirname(tplFile);
  const [outDir, buildDir] = await outputPath(cmd);
  const entrypoint = resolve(buildDir, basename(tplFile));

  await cp(tplDir, buildDir);
  await copyOverrides(config.overrides, buildDir);
  await writeEntrypoint(input, config, buildDir);

  if (watch) {
    watchInput(input, config, buildDir);
    watchTemplate(tplDir, buildDir);
  }

  return [entrypoint, outDir];
}

async function parseInput(input, config) {
  const result = await timeSpinner(
    async () => {
      const source = read(input);
      const definitions = await outboard.load(source, {}, false);

      return definitions;
    },
    {
      start: `Processing input: ${input}`,
      succeed: `Input processed`
    }
  );

  const props = {
    title: result.title,
    description: result.description,
    actions: result.actions,
    tagActions: tagMap(result.tags, result.actions, { sortTags: true }),
    config: config
  };

  return `
import App from './App.svelte';

const app = new App({
  target: document.getElementById("root"),
  props: ${JSON.stringify(props)}
});

export default app;
  `;
}

async function writeEntrypoint(input, config, buildDir) {
  const tplJs = await parseInput(input, config);
  await writeFile(resolve(buildDir, "index.js"), tplJs, "utf8");
}

function watchInput(input, config, buildDir) {
  const watcher = chokidar.watch(input, {
    persistent: true
  });

  watcher.on("change", async path => {
    await writeEntrypoint(input, config, buildDir);
  });

  return watcher;
}

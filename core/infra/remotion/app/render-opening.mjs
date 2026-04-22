import path from "node:path";
import {fileURLToPath} from "node:url";

import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [propsJson, outputPath] = process.argv.slice(2);

if (!propsJson || !outputPath) {
	console.error("Usage: node render-opening.mjs '<json-props>' '/abs/output.mp4'");
	process.exit(1);
}

const props = JSON.parse(propsJson);
const entryPoint = path.join(__dirname, "src", "index.ts");

const bundleLocation = await bundle({
	entryPoint,
	ignoreRegisterRootWarning: true,
	onProgress: () => undefined,
});

const composition = await selectComposition({
	id: "OpeningQuote",
	inputProps: props,
	logLevel: "error",
	serveUrl: bundleLocation,
});

await renderMedia({
	chromiumOptions: {
		gl: "angle",
	},
	codec: "h264",
	composition,
	inputProps: props,
	logLevel: "error",
	outputLocation: outputPath,
	overwrite: true,
	serveUrl: bundleLocation,
});

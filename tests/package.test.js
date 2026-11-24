const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const pkg = require("../package.json");

/** Lowest version mentioned in a node range such as ">=20.9.0", "^18.20.0||>=22" or ">= 14.0". */
function lowestNode(range) {
	const versions = [...String(range).matchAll(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/g)].map((m) => [
		Number(m[1]),
		Number(m[2] || 0),
		Number(m[3] || 0),
	]);
	assert.ok(versions.length, `cannot read a version from engines range "${range}"`);
	return versions.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])[0];
}

function compare(a, b) {
	return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

describe("package.json", () => {
	it("declares the minimum Node.js version", () => {
		assert.ok(pkg.engines && pkg.engines.node, 'missing "engines.node"');
	});

	it("does not allow a Node.js older than any direct dependency supports", () => {
		const own = lowestNode(pkg.engines.node);
		for (const name of Object.keys(pkg.dependencies)) {
			const depPkg = JSON.parse(fs.readFileSync(path.join(root, "node_modules", name, "package.json"), "utf8"));
			if (!depPkg.engines || !depPkg.engines.node) continue;
			const needed = lowestNode(depPkg.engines.node);
			assert.ok(
				compare(own, needed) >= 0,
				`engines.node (${pkg.engines.node}) allows Node older than ${name}@${depPkg.version} requires (${depPkg.engines.node})`
			);
		}
	});

	it("links to the right GitHub repository", () => {
		const expected = "https://github.com/odrick/free-tex-packer-core";
		assert.equal(pkg.homepage, expected + "#readme");
		assert.equal(pkg.bugs && pkg.bugs.url, expected + "/issues");
		assert.match(pkg.repository.url, /github\.com\/odrick\/free-tex-packer-core/);
	});

	it('uses an https "url" (it is written into the exported files as the generator link)', () => {
		assert.equal(pkg.url, "https://github.com/odrick/free-tex-packer-core");
	});
});

describe("published package", () => {
	// `npm pack --dry-run` lists what `npm publish` would upload, without creating anything
	function packedFiles() {
		const result = spawnSync("npm pack --dry-run --json", { cwd: root, encoding: "utf8", shell: true });
		assert.equal(result.status, 0, result.stderr);
		return JSON.parse(result.stdout)[0].files.map((f) => f.path.split("\\").join("/"));
	}

	it("contains the library, its templates and typings", () => {
		const files = packedFiles();
		for (const required of [
			"index.js",
			"index.d.ts",
			"FilesProcessor.js",
			"PackProcessor.js",
			"README.md",
			"LICENSE.md",
			"package.json",
			"exporters/index.js",
			"exporters/list.json",
			"exporters/JsonHash.mst",
			"exporters/XML.mst",
			"packers/index.js",
			"filters/index.js",
			"utils/imageFormats.js",
		]) {
			assert.ok(files.includes(required), `${required} is missing from the package`);
		}
	});

	it("does not contain the tests", () => {
		assert.deepEqual(packedFiles().filter((f) => f.startsWith("tests/")), []);
	});

	it("contains every .mst template listed in exporters/list.json", () => {
		const files = packedFiles();
		for (const exporter of require("../exporters/list.json")) {
			if (exporter.template) assert.ok(files.includes("exporters/" + exporter.template), exporter.template);
		}
	});
});

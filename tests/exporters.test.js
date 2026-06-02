const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const exporterList = require("../exporters/list.json");
const { getExporterByType, startExporter } = require("../exporters/index");
const { packData, exportOptions } = require("./fixtures/pack-data");

/** Shallow clone so startExporter can cache .content without cross-test issues. */
function cloneExporter(exporter) {
	const copy = { ...exporter };
	if (exporter.content) {
		copy.content = exporter.content;
	}
	return copy;
}

function renderExporter(type) {
	const exporter = getExporterByType(type);
	assert.ok(exporter, `unknown exporter type: ${type}`);
	return startExporter(cloneExporter(exporter), packData, exportOptions);
}

const validators = {
	json(output, type) {
		const data = JSON.parse(output);
		assert.ok(
			data.frames || data.file || data.meta || data.textures,
			`${type}: missing expected root fields`
		);
		assert.match(output, /sprites\/hero\.png/);
	},

	jsonPaper2d(output, type) {
		const data = JSON.parse(output);
		assert.equal(data.meta.target, "paper2d", `${type}: expected paper2d meta`);
		validators.json(output, type);
	},

	plist(output, type) {
		assert.match(output, /<\?xml/);
		assert.match(output, /<plist/);
		assert.match(output, /sprites\/hero\.png/);
	},

	starlingXml(output, type) {
		assert.match(output, /<TextureAtlas/);
		assert.match(output, /sprites\/hero\.png/);
	},

	textXml(output, type) {
		assert.match(output, /sprites\/hero\.png/);
		assert.match(output, /\n[nxwhp]/);
	},

	css(output, type) {
		assert.match(output, /\.sprites\/hero\.png/);
		assert.match(output, /background:url\(texture\.png\)/);
	},

	unityTpsheet(output, type) {
		assert.match(output, /:format=40300/);
		assert.match(output, /:texture=texture\.png/);
		assert.match(output, /sprites-hero/);
	},

	godotJson(output, type) {
		const data = JSON.parse(output);
		assert.ok(Array.isArray(data.textures), `${type}: expected textures array`);
		assert.equal(data.textures[0].image, "texture.png");
		assert.match(output, /sprites\/hero\.png/);
	},

	spineAtlas(output, type) {
		assert.match(output, /^texture\.png/m);
		assert.match(output, /sprites\/hero\.png/);
		assert.match(output, /rotate: (true|false)/);
	},
};

/** Validator keyed by exporter type (fileExt alone is ambiguous, e.g. tpsheet = Unity vs Godot). */
const validatorByType = {
	JsonHash: validators.json,
	JsonArray: validators.json,
	Pixi: validators.json,
	PhaserHash: validators.json,
	PhaserArray: validators.json,
	Phaser3: validators.json,
	Egret2D: validators.json,
	Unreal: validators.jsonPaper2d,
	GodotAtlas: validators.godotJson,
	GodotTileset: validators.godotJson,
	XML: validators.textXml,
	Starling: validators.starlingXml,
	Css: validators.css,
	OldCss: validators.css,
	Cocos2d: validators.plist,
	UIKit: validators.plist,
	Unity3D: validators.unityTpsheet,
	Spine: validators.spineAtlas,
};

function validateOutput(exporter, output) {
	const validate = validatorByType[exporter.type];
	assert.ok(validate, `no validator for exporter type: ${exporter.type}`);
	validate(output, exporter.type);
}

describe("exporters (mustache templates)", () => {
	for (const exporter of exporterList) {
		it(`renders ${exporter.type} (.${exporter.fileExt})`, () => {
			const output = renderExporter(exporter.type);
			assert.ok(output.length > 0, `${exporter.type}: empty output`);
			validateOutput(exporter, output);
		});
	}
});

describe("mustache-wax formatters", () => {
	it("Unity3D mirror formatter flips Y against image height", () => {
		const output = renderExporter("Unity3D");
		// hero: y=0, h=48, imageHeight=64 -> mirror = 16
		assert.match(output, /sprites-hero\.png;0;16;32;48/);
		// enemy: y=0, h=16 -> mirror = 48
		assert.match(output, /enemy\.png;32;48;16;16/);
	});

	it("Unity3D escapeName formatter sanitizes path separators", () => {
		const output = renderExporter("Unity3D");
		assert.doesNotMatch(output, /sprites\/hero/);
		assert.match(output, /sprites-hero/);
	});

	it("Cocos2d offsetLeft and offsetRight formatters", () => {
		const output = renderExporter("Cocos2d");
		// hero offsetLeft: (2 + 28/2) - 32/2 = 0; offsetRight: 24 - (4 + 20) = 0
		assert.match(output, /<key>offset<\/key>\s*<string>\{0,0\}<\/string>/);
		assert.match(output, /<key>frame<\/key>\s*<string>\{\{0,0\},\{32,48\}\}<\/string>/);
	});
});

describe("getExporterByType", () => {
	it("is case-insensitive", () => {
		assert.equal(getExporterByType("jsonhash").type, "JsonHash");
	});

	it("returns null for unknown type", () => {
		assert.equal(getExporterByType("NotAFormat"), null);
	});
});

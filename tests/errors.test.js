const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const pack = require("../index");
const { packAsync } = pack;

/** A small valid PNG, so that these tests do not depend on the local (git-ignored) tests/images folder. */
async function makePng(width, height, color) {
	return sharp({ create: { width, height, channels: 4, background: color } }).png().toBuffer();
}

let red;
let green;
before(async () => {
	red = await makePng(16, 12, { r: 220, g: 40, b: 40, alpha: 1 });
	green = await makePng(10, 20, { r: 40, g: 200, b: 60, alpha: 1 });
});

const NOT_AN_IMAGE = Buffer.from("this is not an image");

const valid = () => [
	{ path: "red.png", contents: red },
	{ path: "green.png", contents: green },
];

/** Calls the callback API; never throws and gives up (instead of hanging) when the callback is not called. */
function callPack(images, options, timeoutMs = 4000) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("the callback was not called within " + timeoutMs + " ms")), timeoutMs);
		try {
			pack(images, options, (result, error) => {
				clearTimeout(timer);
				resolve({ result, error });
			});
		} catch (e) {
			clearTimeout(timer);
			reject(new Error("pack() threw synchronously instead of reporting through the callback: " + e.message));
		}
	});
}

/** Calls the promise API; the promise must reject, the call itself must not throw. */
async function packRejects(images, options, pattern) {
	let promise;
	assert.doesNotThrow(() => {
		promise = packAsync(images, options);
	}, "packAsync() threw synchronously instead of returning a rejected promise");
	assert.ok(promise && typeof promise.then === "function", "packAsync() must return a promise");
	await assert.rejects(promise, pattern);
}

describe("invalid options are reported, not thrown", () => {
	const cases = [
		["unknown exporter", { exporter: "NoSuchExporter" }, /free-tex-packer-core: Unknown exporter NoSuchExporter/],
		["unknown packer", { packer: "NoSuchPacker" }, /free-tex-packer-core: Unknown packer NoSuchPacker/],
		["unknown packer method", { packerMethod: "NoSuchMethod" }, /free-tex-packer-core: Unknown packer method NoSuchMethod/],
		["unknown filter", { filter: "NoSuchFilter" }, /free-tex-packer-core: Unknown filter NoSuchFilter/],
		["unsupported textureFormat", { textureFormat: "bmp" }, /Unsupported textureFormat "bmp"/],
	];

	for (const [name, options, pattern] of cases) {
		it(`${name}: the callback gets the error`, async () => {
			const { result, error } = await callPack(valid(), options);
			assert.equal(result, undefined);
			assert.ok(error instanceof Error, "expected an Error");
			assert.match(error.message, pattern);
		});

		it(`${name}: packAsync() rejects`, async () => {
			await packRejects(valid(), options, pattern);
		});
	}

	it("an unknown exporter is a readable error, not a TypeError about null", async () => {
		const { error } = await callPack(valid(), { exporter: "NoSuchExporter" });
		assert.doesNotMatch(error.message, /Cannot read propert/);
		assert.equal(error.constructor, Error);
	});
});

describe("invalid input is reported, not hung or thrown", () => {
	it("an empty list of images", async () => {
		const { result, error } = await callPack([], {});
		assert.equal(result, undefined);
		assert.match(error.message, /No images to pack/);
		await packRejects([], {}, /No images to pack/);
	});

	it("images that are not a list", async () => {
		const { error } = await callPack(null, {});
		assert.match(error.message, /images must be an array/);
		await packRejects(undefined, {}, /images must be an array/);
	});
});

describe("images that cannot be read", () => {
	let consoleErrors;
	let original;
	before(() => {
		original = console.error;
	});

	function silence() {
		consoleErrors = [];
		console.error = (...args) => consoleErrors.push(args.join(" "));
	}
	const restore = () => (console.error = original);

	it("a single undecodable image fails instead of never calling back", async () => {
		const { result, error } = await callPack([{ path: "bad.png", contents: NOT_AN_IMAGE }], {});
		assert.equal(result, undefined);
		assert.match(error.message, /Cannot read 1 image/);
		assert.match(error.message, /bad\.png/);
	});

	it("an undecodable image next to valid ones fails the run, nothing is packed without it", async () => {
		const { result, error } = await callPack([...valid(), { path: "sub/bad.png", contents: NOT_AN_IMAGE }], {});
		assert.equal(result, undefined);
		assert.match(error.message, /sub\/bad\.png/);
		assert.doesNotMatch(error.message, /red\.png|green\.png/, "valid images must not be listed");
	});

	it("lists every unreadable image in the order they were given", async () => {
		const images = [
			{ path: "z-bad.png", contents: NOT_AN_IMAGE },
			{ path: "ok.png", contents: red },
			{ path: "a-bad.png", contents: Buffer.alloc(0) },
		];
		const { error } = await callPack(images, {});
		assert.match(error.message, /Cannot read 2 images/);
		assert.ok(error.message.indexOf("z-bad.png") < error.message.indexOf("a-bad.png"), error.message);
	});

	it("a file without contents, or with contents that are not a Buffer, is unreadable too", async () => {
		const { error } = await callPack(
			[
				{ path: "no-contents.png" },
				{ path: "text.png", contents: "just text" },
				{ path: "ok.png", contents: red },
			],
			{}
		);
		assert.match(error.message, /no-contents\.png/);
		assert.match(error.message, /text\.png/);
	});

	it("an entry that is not an object is unreadable", async () => {
		const { error } = await callPack([null, { path: "ok.png", contents: red }], {});
		assert.match(error.message, /Cannot read 1 image/);
	});

	it("packAsync() rejects with the same error", async () => {
		await packRejects([...valid(), { path: "bad.png", contents: NOT_AN_IMAGE }], {}, /Cannot read 1 image.*bad\.png/);
	});

	it("does not write to console.error any more (the error carries the information)", async () => {
		silence();
		try {
			await callPack([...valid(), { path: "bad.png", contents: NOT_AN_IMAGE }], {});
		} finally {
			restore();
		}
		assert.deepEqual(consoleErrors, []);
	});

	it("valid images are still packed, with the error argument left undefined", async () => {
		const { result, error } = await callPack(valid(), { textureName: "ok" });
		assert.equal(error, undefined);
		assert.deepEqual(result.map((f) => f.name).sort(), ["ok.json", "ok.png"]);
	});
});

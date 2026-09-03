import { parseSaveGame, writeSaveGame } from "@konove/oni-save-parser";

// src/tsconfig.json restricts `types` to webpack-env and jest on purpose: this
// is a browser bundle, and letting `process` or `Buffer` typecheck inside a
// component would be a footgun that only shows up at runtime. This spec is the
// one place that needs the filesystem, so it takes what it needs here rather
// than widening the whole project. `require` is already declared by
// webpack-env; `__dirname` is not.
declare const __dirname: string;

const fs = require("fs");
const path = require("path");

/**
 * The only test anywhere that puts real save bytes through the parser.
 *
 * `save-game.json` is already-parsed JSON, so the binary reader, the binary
 * writer and the zlib layer are exercised by nothing else in either
 * repository - not by the jest suites, which build 4- and 8-byte ArrayBuffers
 * for state machine blobs, and not by the screenshots, which load the JSON.
 * That is the code that turns a colony into a file the game has to accept, so
 * it is the code a dependency upgrade in the parser is most likely to break
 * and least likely to be caught breaking.
 *
 * `save-game.sav` is a real colony: Spaced Out with the Frosty, Bionic and
 * Prehistoric packs, save version 7.36, 8550 game objects. Chosen over two
 * larger saves because it carries the most content packs in the fewest bytes
 * and parses in about a quarter of the time.
 */
const FIXTURE = path.join(__dirname, "../../__mocks__/save-game.sav");

function readFixture(): ArrayBuffer {
  const buffer = fs.readFileSync(FIXTURE);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

describe("a real save through the parser and back", () => {
  type Save = ReturnType<typeof parseSaveGame>;

  // Done once and shared. A parse is about ten seconds of real work on this
  // fixture, so doing it per test made the suite alone longer than every other
  // suite put together.
  let first: Save;
  let second: Save;

  beforeAll(() => {
    first = parseSaveGame(readFixture());
    second = parseSaveGame(writeSaveGame(first));
  }, 120_000);

  it("reads the colony the game actually wrote", () => {
    const save = first;

    expect(save.header.gameInfo.baseName).toBe("Asteroid");
    expect(save.header.gameInfo.dlcIds).toEqual([
      "EXPANSION1_ID",
      "DLC4_ID",
      "DLC2_ID",
      "DLC3_ID",
    ]);
    expect(`${save.version.major}.${save.version.minor}`).toBe("7.36");
  });

  it("writes it back and reads the same colony again", () => {
    expect(second.header.gameInfo).toEqual(first.header.gameInfo);
    expect(second.gameObjects.map((group) => group.name)).toEqual(
      first.gameObjects.map((group) => group.name),
    );
    expect(second.gameObjects.map((group) => group.gameObjects.length)).toEqual(
      first.gameObjects.map((group) => group.gameObjects.length),
    );
  });

  // The counts above would survive a writer that dropped every behavior from
  // every object, so this looks inside one: the duplicants, which are what the
  // editor spends its time changing.
  it("keeps what is inside the objects, not just their shape", () => {
    const minions = (save: Save) =>
      save.gameObjects.find((group) => group.name === "Minion")!.gameObjects;

    expect(minions(second)).toHaveLength(minions(first).length);
    expect(minions(second)[0].behaviors.map((b) => b.name)).toEqual(
      minions(first)[0].behaviors.map((b) => b.name),
    );
    expect(minions(second)[0].position).toEqual(minions(first)[0].position);
  });
});

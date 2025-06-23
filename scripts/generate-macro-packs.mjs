import path from "path";
import fs from "fs/promises";
import { applyOpsToDb, generateID } from "./shared.mjs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const baseDir = path.dirname(__dirname);
const extraOptionsPrefix = "//! ";

/**
 * Reads JavaScript files from a specified directory and returns an array of macro objects.
 *
 * @param {string} directory - The name of the directory where the JavaScript files are located.
 * @returns {Promise<Array>} - A promise that resolves to an array of macro objects.
 */
async function filesToMacros(directory) {
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".js"));
  const macros = files.map(async (filename) => {
    const content = await fs.readFile(path.join(directory, filename), "utf8");
    const lines = content.split("\n");
    const icon = lines[0].split(" ").pop();
    let linesToskip = 1;
    let extraOptions;

    if (lines.length > 2 && lines[1].startsWith(extraOptionsPrefix)) {
      linesToskip++;
      extraOptions = JSON.parse(lines[1].substring(extraOptionsPrefix.length));
    }
    // Transform file-name.js to File Name.
    const name = filename.charAt(0).toUpperCase() + filename.slice(1).split(".")[0].replaceAll("-", " ");
    // generate id from hash to keep it consistent between executions.
    const id = generateID(filename);

    return {
      _id: id,
      name,
      img: icon,
      author: "Lcb3Tp0080WA9XUU", // This irrelevant but required.
      ownership: { default: 2 },
      type: "script",
      scope: "global",
      command: lines.slice(linesToskip).join("\n"),
      ...extraOptions,
    };
  });

  return Promise.all(macros);
}

/**
 * Creates a new pack in the packs directory with the provided macros.
 * @param {string} pack - The name of the pack.
 * @param {Array} macros - An array of objects representing macros.
 * @returns {Promise} A promise that resolves when the database has been wrote and closed.
 */
async function createPack(pack, macros) {
  const dbPath = path.join(baseDir, "packs", pack);
  const operations = macros.map((macro) => ({ type: "put", key: `!macros!${macro._id}`, value: macro }));
  return applyOpsToDb(dbPath, operations);
}

// Create packs directory if it doesn't exist
await fs.mkdir(path.join(__dirname, "..", "packs"), { recursive: true });

const mod = JSON.parse(await fs.readFile(path.join(__dirname, "..", "module.json")));
const packs = mod.packs.filter((pack) => pack.type === "Macro").map((pack) => pack.name.replace("cl4-", ""));

for (const pack of packs) {
  filesToMacros(path.join(baseDir, pack))
    .then((macros) => createPack(pack, macros))
    .catch((err) => console.error(err));
}

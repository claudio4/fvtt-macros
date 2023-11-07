import { ClassicLevel } from "classic-level";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * Reads JavaScript files from a specified directory and returns an array of macro objects.
 *
 * @param {string} directory - The name of the directory where the JavaScript files are located.
 * @returns {Promise<Array>} - A promise that resolves to an array of macro objects.
 */
async function filesToMacros(directory) {
  const files = (await fs.readdir(path.join(__dirname, "..", directory))).filter((file) => file.endsWith(".js"));
  const macros = files.map(async (file) => {
    const content = await fs.readFile(path.join(__dirname, "..", directory, file), "utf8");
    const lines = content.split("\n");
    const icon = lines[0].split(" ").pop();
    // Transform file-name.js to File Name.
    const name = file.charAt(0).toUpperCase() + file.slice(1).split(".")[0].replaceAll("-", " ");
    // generate id from hash to keep it consistent between executions.
    const id = crypto.createHash("sha1").update(file).digest("hex").slice(0, 16);

    return {
      _id: id,
      name,
      img: icon,
      author: "Lcb3Tp0080WA9XUU", // This irrelevant but required.
      type: "script",
      scope: "global",
      command: lines.slice(1).join("\n"),
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
  const db = new ClassicLevel(path.join(__dirname, "..", "packs", pack), { valueEncoding: "json" });
  const operations = macros.map((macro) => ({ type: "put", key: `!macros!${macro._id}`, value: macro }));
  await db.batch(operations);
  return db.close();
}

// Create packs directory if it doesn't exist
await fs.mkdir(path.join(__dirname, "..", "packs"), { recursive: true });

const mod = JSON.parse(await fs.readFile(path.join(__dirname, "..", "module.json")));
const packs = mod.packs.map((pack) => pack.name.replace("cl4-", ""));

for (const pack of packs) {
  filesToMacros(pack)
    .then((macros) => createPack(pack, macros))
    .catch((err) => console.error(err));
}

import path from "path";
import fs from "fs/promises";
import { applyOpsToDb, generateID } from "./shared.mjs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * @typedef {object} LanguageRollableTable
 * @property {string} title - The name of the rollable table
 * @property {*} values - The possible values of the rollable table. If an object is given the keys will be treated as variants (ex. male and female) and a subtable will be created for each vairant.
 */

/**
 * Read all files from folder and parses them as JSON
 * @param {string} directory.
 * @returns {Promise<Array<Promise<LanguageRollableTable>>>}
 */
async function readFiles(directory) {
  const allFiles = await fs.readdir(directory);
  const files = allFiles.filter((name) => !name.startsWith("_") && name.endsWith(".json"));
  const result = files.map(async (file) => {
    const contents = await fs.readFile(path.join(directory, file), "utf8");
    return JSON.parse(contents);
  });

  return result;
}

/**
 * @param {Promise<LanguageRollableTable>} fileContents
 * @param {string} folderForVariants - The ID of the folder to store variant tables.
 */
async function processFile(fileContents, folderForVariants = null) {
  const tableData = await fileContents;
  if (Array.isArray(tableData.values)) {
    return mapTableDataToSingleRollableTable(tableData);
  }

  const id = generateID(tableData.title);
  const variants = Object.entries(tableData.values);
  const subOps = variants.map(([title, values]) =>
    mapTableDataToSingleRollableTable({ title: `${tableData.title} - ${title}`, values }, folderForVariants),
  );

  const subTables = subOps.map((ops) => ops.at(-1).value);
  const tableResults = mapSubTableToTableResults(id, subTables);
  const resultsIds = tableResults.map((r) => r.value._id);
  subOps.push(tableResults);

  const table = {
    folder: null,
    name: tableData.title,
    img: "icons/svg/d20-grey.svg",
    description: "",
    results: resultsIds,
    replacement: true,
    displayRoll: true,
    formula: `1d${tableResults.length}`,
    _id: id,
    sort: 0,
    ownership: {
      default: 2,
    },
  };

  const ops = subOps.flat(1);
  ops.push({
    type: "put",
    key: `!tables!${id}`,
    value: table,
  });

  return ops;
}

/**
 * @param {LanguageRollableTable} tableData
 * @param {string} folder
 */
function mapTableDataToSingleRollableTable(tableData, folder = null) {
  const id = generateID(tableData.title);
  const ops = mapNamesToTableResults(id, tableData.values);

  const resultsIds = ops.map(({ value }) => value._id);

  const table = {
    folder: folder,
    name: tableData.title,
    img: "icons/svg/d20-grey.svg",
    description: "",
    results: resultsIds,
    replacement: true,
    displayRoll: true,
    formula: `1d${ops.length}`,
    _id: id,
    sort: 0,
    ownership: {
      default: 2,
    },
  };

  ops.push({
    type: "put",
    key: `!tables!${id}`,
    value: table,
  });

  return ops;
}

function mapSubTableToTableResults(tableId, subTables) {
  const baseKey = `!tables.results!${tableId}.`;
  return subTables.map((subtable, i) => {
    const id = generateID(subtable.name);
    return {
      type: "put",
      key: baseKey + id,
      value: {
        type: 2,
        documentCollection: "claudio4-macros.cl4-name-tables",
        weight: 1,
        range: [i + 1, i + 1],
        drawn: false,
        text: subtable.name,
        documentId: subtable._id,
        img: "icons/svg/d20-grey.svg",
        _id: id,
      },
    };
  });
}

/**
 * Transforms an array of names to an array of table results
 * @param {string} tableId
 * @param {Array<string>} names
 */
function mapNamesToTableResults(tableId, names) {
  const baseKey = `!tables.results!${tableId}.`;
  return names.map((name, i) => {
    const id = generateID(name);
    return {
      type: "put",
      key: baseKey + id,
      value: {
        type: 0,
        weight: 1,
        range: [i + 1, i + 1],
        drawn: false,
        _id: id,
        text: name,
        documentId: null,
        img: "icons/svg/d20-black.svg",
      },
    };
  });
}

function addFolder(name, parent = null) {
  const id = generateID(name);
  return {
    type: "put",
    key: `!folders!${id}`,
    value: {
      name,
      sorting: "a",
      folder: parent,
      type: "RollTable",
      _id: id,
      sort: 0,
      color: null,
    },
  };
}

async function main(baseDirectory) {
  const namesDirectory = path.join(baseDirectory, "names");

  const filesPromises = await readFiles(namesDirectory);
  const variantsFolder = addFolder("Variants");
  const opsPromises = filesPromises.map((p) => processFile(p, variantsFolder.value._id));
  const ops = (await Promise.all(opsPromises)).flat(1);
  ops.push(variantsFolder);
  applyOpsToDb(path.join(baseDirectory, "packs", "name-tables"), ops);
}

const baseDirectory = path.dirname(__dirname);
main(baseDirectory);

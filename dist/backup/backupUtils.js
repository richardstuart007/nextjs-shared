'use server';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.directory_Exists = directory_Exists;
exports.directory_create = directory_create;
exports.directory_delete = directory_delete;
exports.directory_list = directory_list;
exports.file_exists = file_exists;
exports.file_count_json = file_count_json;
exports.file_delete = file_delete;
exports.convertCsvToJson = convertCsvToJson;
exports.table_write_toJSON = table_write_toJSON;
exports.table_write_fromJSON = table_write_fromJSON;
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const readline_1 = __importDefault(require("readline"));
const db_1 = require("../tables/db");
const write_logging_1 = require("../tables/tableGeneric/write_logging");
//--------------------------------------------------------------------------
//  Checks if a directory exists on the system
//--------------------------------------------------------------------------
async function directory_Exists(dirPath, caller = '') {
    const functionName = 'directory_Exists';
    try {
        const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
        return exists;
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return false;
    }
}
//--------------------------------------------------------------------------
//  Creates a directory on the system
//--------------------------------------------------------------------------
async function directory_create(dirPath, caller = '') {
    const functionName = 'directory_create';
    try {
        let createDirectory = false;
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            createDirectory = true;
        }
        return createDirectory;
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return false;
    }
}
//--------------------------------------------------------------------------
//  Deletes a directory from the system
//--------------------------------------------------------------------------
async function directory_delete(dirPath, caller = '') {
    const functionName = 'directory_delete';
    try {
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            return true;
        }
        return false;
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return false;
    }
}
//--------------------------------------------------------------------------
//  Lists files in a directory
//--------------------------------------------------------------------------
async function directory_list(dirPath, caller = '') {
    const functionName = 'directory_list';
    try {
        if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
            const errorMessage = `The provided path (${dirPath}) is not a valid directory`;
            (0, write_logging_1.write_Logging)({
                lg_caller: caller,
                lg_functionname: functionName,
                lg_msg: errorMessage,
                lg_severity: 'E'
            });
            return [];
        }
        const files = fs.readdirSync(dirPath);
        const filesList = files.filter(file => fs.statSync(path_1.default.join(dirPath, file)).isFile());
        return filesList;
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return [];
    }
}
//--------------------------------------------------------------------------
//  Checks if a file exists on the system
//--------------------------------------------------------------------------
async function file_exists(filePath, caller = '') {
    const functionName = 'file_exists';
    try {
        const exist = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
        return exist;
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return false;
    }
}
//--------------------------------------------------------------------------
//  Returns the number of records in a JSON file (array)
//--------------------------------------------------------------------------
async function file_count_json(filePath, caller = '') {
    const functionName = 'file_count_json';
    try {
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile())
            return 0;
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.length : 0;
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return 0;
    }
}
//--------------------------------------------------------------------------
//  Deletes a file from the system
//--------------------------------------------------------------------------
async function file_delete(filePath, caller = '') {
    const functionName = 'file_delete';
    try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return false;
    }
}
//--------------------------------------------------------------------------
//  Convert the data csv to json
//--------------------------------------------------------------------------
async function convertCsvToJson(dirPath, file_in, file_out, caller = '') {
    const functionName = 'convertCsvToJson';
    try {
        const Path_file_in = path_1.default.resolve(dirPath, file_in);
        const Path_file_out = path_1.default.resolve(dirPath, file_out);
        const shouldOverwrite = await confirmOverwrite(Path_file_out);
        if (shouldOverwrite) {
            processCsv(Path_file_in, Path_file_out);
        }
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
    }
}
//--------------------------------------------------------------------------
//  Prompt the user for confirmation to overwrite the output file if it already exists
//--------------------------------------------------------------------------
async function confirmOverwrite(Path_file_out, caller = '') {
    const functionName = 'confirmOverwrite';
    try {
        return new Promise(resolve => {
            const rl = readline_1.default.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(`The file ${Path_file_out} already exists. Do you want to overwrite it? (y/n): `, answer => {
                rl.close();
                resolve(answer.toLowerCase() === 'y');
            });
        });
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return false;
    }
}
//--------------------------------------------------------------------------
//  Process the CSV and write it to the output JSON file
//--------------------------------------------------------------------------
async function processCsv(Path_file_in, Path_file_out, caller = '') {
    const functionName = 'processCsv';
    try {
        const results = [];
        fs.createReadStream(Path_file_in)
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => {
            results.push(row);
        })
            .on('end', () => {
            const formattedData = JSON.stringify(results, null, 4);
            fs.writeFileSync(Path_file_out, formattedData, 'utf-8');
            (0, write_logging_1.write_Logging)({
                lg_caller: caller,
                lg_functionname: functionName,
                lg_msg: `CSV data has been converted and saved to ${Path_file_out}`,
                lg_severity: 'I'
            });
        })
            .on('error', (error) => {
            console.error('An error occurred:', error.message);
        });
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
    }
}
async function table_write_toJSON(Props, caller = '') {
    const functionName = 'table_write_toJSON';
    const { table, dirPath, file_out } = Props;
    try {
        const query = `SELECT json_agg(t) FROM ${table} t`;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: `${query} dirPath: ${dirPath} file_out: ${file_out}`,
            lg_severity: 'I'
        });
        const db = await (0, db_1.sql)();
        const result = await db.query({
            caller: '',
            query: query,
            params: [],
            functionName: functionName
        });
        if (!result || !result.rows || result.rows.length === 0 || !result.rows[0].json_agg) {
            (0, write_logging_1.write_Logging)({
                lg_caller: caller,
                lg_functionname: functionName,
                lg_msg: `No data found in the table ${table}`,
                lg_severity: 'E'
            });
            return false;
        }
        const jsonAggArray = result.rows[0].json_agg;
        if (!Array.isArray(jsonAggArray)) {
            throw new Error('json_agg is not an array');
        }
        const processedData = processJsonAgg(jsonAggArray);
        const outputDir = path_1.default.resolve(dirPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path_1.default.join(outputDir, file_out);
        fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf-8');
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: `Data saved as JSON to ${outputPath}`,
            lg_severity: 'I'
        });
        return true;
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return false;
    }
}
//--------------------------------------------------------------------------
//  Processes the json_agg array by formatting the data
//--------------------------------------------------------------------------
function processJsonAgg(jsonAggArray, caller = '') {
    const functionName = 'processJsonAgg';
    try {
        return jsonAggArray.map(row => {
            const formattedRow = {};
            for (const [key, value] of Object.entries(row)) {
                formattedRow[key.toLowerCase()] = value;
            }
            return formattedRow;
        });
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return [];
    }
}
//--------------------------------------------------------------------------
//  Uploads the content of a JSON file to the PostgreSQL database
//--------------------------------------------------------------------------
async function table_write_fromJSON(filePath, tableName, caller = '') {
    const functionName = 'table_write_fromJSON';
    const BATCH_SIZE = 100;
    try {
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: `filePath: ${filePath}, tableName: ${tableName}`,
            lg_severity: 'I'
        });
        if (!fs.existsSync(filePath)) {
            const msg = `File not found: ${filePath}`;
            (0, write_logging_1.write_Logging)({ lg_caller: caller, lg_functionname: functionName, lg_msg: msg, lg_severity: 'E' });
            throw new Error(msg);
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        if (!Array.isArray(jsonData)) {
            const msg = `JSON data is not an array. Expected an array of objects file ${filePath}`;
            (0, write_logging_1.write_Logging)({ lg_caller: caller, lg_functionname: functionName, lg_msg: msg, lg_severity: 'E' });
            throw new Error(msg);
        }
        if (jsonData.length === 0) {
            const msg = `No data found in the JSON file ${filePath}`;
            (0, write_logging_1.write_Logging)({ lg_caller: caller, lg_functionname: functionName, lg_msg: msg, lg_severity: 'E' });
            throw new Error(msg);
        }
        let totalInserted = 0;
        const db = await (0, db_1.sql)();
        for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
            const batch = jsonData.slice(i, i + BATCH_SIZE);
            const columns = Object.keys(batch[0]);
            const column_names = columns.join(', ');
            const values = batch.map(row => Object.values(row));
            const flattenedValues = values.flat();
            const placeholders = values
                .map((_, rowIdx) => `(${columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`).join(', ')})`)
                .join(', ');
            const sqlStatement = `
          INSERT INTO ${tableName}
              (${column_names})
              VALUES ${placeholders}
          RETURNING *;
          `;
            const result = await db.query({
                caller: '',
                query: sqlStatement,
                params: flattenedValues,
                functionName: functionName
            });
            totalInserted += result?.rowCount || 0;
        }
        return totalInserted;
    }
    catch (error) {
        const errorMessage = error.message;
        (0, write_logging_1.write_Logging)({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E'
        });
        return 0;
    }
}

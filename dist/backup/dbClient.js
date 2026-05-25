"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readEnvVar = readEnvVar;
exports.read_url = read_url;
exports.read_location = read_location;
exports.createClient = createClient;
const pg_1 = require("pg");
const fs_1 = require("fs");
//--------------------------------------------------------------------------
//  Read a single variable from a .env file on disk
//--------------------------------------------------------------------------
function readEnvVar(envFile, varName) {
    try {
        const content = (0, fs_1.readFileSync)(envFile, 'utf8');
        const match = content.match(new RegExp(`^${varName}=(.+)$`, 'm'));
        return match ? match[1].trim() : '';
    }
    catch {
        return '';
    }
}
//--------------------------------------------------------------------------
//  Read POSTGRES_URL from a .env file
//--------------------------------------------------------------------------
function read_url(envFile) {
    return readEnvVar(envFile, 'POSTGRES_URL');
}
//--------------------------------------------------------------------------
//  Read POSTGRES_DATABASE_LOCATION from a .env file
//--------------------------------------------------------------------------
function read_location(envFile) {
    return readEnvVar(envFile, 'POSTGRES_DATABASE_LOCATION');
}
//--------------------------------------------------------------------------
//  Create and connect a pg.Client from a .env file path or the environment.
//  If envFile is provided, POSTGRES_URL is read from that file.
//  Otherwise, process.env.POSTGRES_URL is used.
//  Caller is responsible for calling client.end() when done.
//--------------------------------------------------------------------------
async function createClient(envFile) {
    const connectionString = envFile
        ? readEnvVar(envFile, 'POSTGRES_URL')
        : (process.env.POSTGRES_URL ?? '');
    const client = new pg_1.Client({ connectionString });
    await client.connect();
    return client;
}

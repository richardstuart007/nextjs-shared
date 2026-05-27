'use server'

import * as fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import readline from 'readline'
import { sql } from '../tables/db'
import { write_Logging } from '../tables/tableGeneric/write_logging'
/** Return true if dirPath exists and is a directory. */
export async function directory_Exists(dirPath: string, caller: string = ''): Promise<boolean> {
  const functionName = 'directory_Exists'
  try {
    const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
    return exists
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return false
  }
}
/** Create dirPath (recursive); returns true if a new directory was created, false if it already existed. */
export async function directory_create(dirPath: string, caller: string = ''): Promise<boolean> {
  const functionName = 'directory_create'
  try {
    let createDirectory = false
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      createDirectory = true
    }
    return createDirectory
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return false
  }
}
/** Recursively delete dirPath; returns true if it existed and was removed. */
export async function directory_delete(dirPath: string, caller: string = ''): Promise<boolean> {
  const functionName = 'directory_delete'
  try {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      fs.rmSync(dirPath, { recursive: true, force: true })
      return true
    }
    return false
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return false
  }
}
/** Return an array of file names (not directories) inside dirPath. */
export async function directory_list(dirPath: string, caller: string = ''): Promise<string[]> {
  const functionName = 'directory_list'
  try {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      const errorMessage = `The provided path (${dirPath}) is not a valid directory`
      write_Logging({
        lg_caller: caller,
        lg_functionname: functionName,
        lg_msg: errorMessage,
        lg_severity: 'E'
      })
      return []
    }
    const files = fs.readdirSync(dirPath)
    const filesList = files.filter(file => fs.statSync(path.join(dirPath, file)).isFile())
    return filesList
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return []
  }
}
/** Return true if filePath exists and is a file (not a directory). */
export async function file_exists(filePath: string, caller: string = ''): Promise<boolean> {
  const functionName = 'file_exists'
  try {
    const exist = fs.existsSync(filePath) && fs.statSync(filePath).isFile()
    return exist
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return false
  }
}
/** Return the number of elements in a JSON array file; returns 0 if the file is missing or not an array. */
export async function file_count_json(filePath: string, caller: string = ''): Promise<number> {
  const functionName = 'file_count_json'
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return 0
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return 0
  }
}
/** Delete filePath if it exists; returns true if a file was removed. */
export async function file_delete(filePath: string, caller: string = ''): Promise<boolean> {
  const functionName = 'file_delete'
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return false
  }
}
//--------------------------------------------------------------------------
//  Convert the data csv to json
//--------------------------------------------------------------------------
export async function convertCsvToJson(
  dirPath: string,
  file_in: string,
  file_out: string,
  caller: string = ''
): Promise<void> {
  const functionName = 'convertCsvToJson'
  try {
    const Path_file_in = path.resolve(dirPath, file_in)
    const Path_file_out = path.resolve(dirPath, file_out)
    const shouldOverwrite = await confirmOverwrite(Path_file_out)
    if (shouldOverwrite) {
      processCsv(Path_file_in, Path_file_out)
    }
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
  }
}
//--------------------------------------------------------------------------
//  Prompt the user for confirmation to overwrite the output file if it already exists
//--------------------------------------------------------------------------
async function confirmOverwrite(Path_file_out: string, caller: string = ''): Promise<boolean> {
  const functionName = 'confirmOverwrite'
  try {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      rl.question(
        `The file ${Path_file_out} already exists. Do you want to overwrite it? (y/n): `,
        answer => {
          rl.close()
          resolve(answer.toLowerCase() === 'y')
        }
      )
    })
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return false
  }
}
//--------------------------------------------------------------------------
//  Process the CSV and write it to the output JSON file
//--------------------------------------------------------------------------
async function processCsv(
  Path_file_in: string,
  Path_file_out: string,
  caller: string = ''
): Promise<void> {
  const functionName = 'processCsv'
  try {
    const results: Record<string, any>[] = []
    fs.createReadStream(Path_file_in)
      .pipe(csv())
      .on('data', (row: Record<string, any>) => {
        results.push(row)
      })
      .on('end', () => {
        const formattedData = JSON.stringify(results, null, 4)
        fs.writeFileSync(Path_file_out, formattedData, 'utf-8')
        write_Logging({
          lg_caller: caller,
          lg_functionname: functionName,
          lg_msg: `CSV data has been converted and saved to ${Path_file_out}`,
          lg_severity: 'I'
        })
      })
      .on('error', (error: Error) => {
        console.error('An error occurred:', error.message)
      })
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
  }
}
interface Props {
  table: string
  dirPath: string
  file_out: string
}
/** Export a table to a JSON file in dirPath; returns true on success. Uses json_agg so data is fetched in one query. */
export async function table_write_toJSON(Props: Props, caller: string = ''): Promise<boolean> {
  const functionName = 'table_write_toJSON'
  const { table, dirPath, file_out } = Props
  try {
    const query = `SELECT json_agg(t) FROM ${table} t`
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: `${query} dirPath: ${dirPath} file_out: ${file_out}`,
      lg_severity: 'I'
    })
    const db = await sql()
    const result = await db.query({
      caller: '',
      query: query,
      params: [],
      functionName: functionName
    })
    if (!result || !result.rows || result.rows.length === 0 || !result.rows[0].json_agg) {
      write_Logging({
        lg_caller: caller,
        lg_functionname: functionName,
        lg_msg: `No data found in the table ${table}`,
        lg_severity: 'E'
      })
      return false
    }
    const jsonAggArray = result.rows[0].json_agg
    if (!Array.isArray(jsonAggArray)) {
      throw new Error('json_agg is not an array')
    }
    const processedData = processJsonAgg(jsonAggArray)
    const outputDir = path.resolve(dirPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    const outputPath = path.join(outputDir, file_out)
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf-8')
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: `Data saved as JSON to ${outputPath}`,
      lg_severity: 'I'
    })
    return true
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return false
  }
}
//--------------------------------------------------------------------------
//  Processes the json_agg array by formatting the data
//--------------------------------------------------------------------------
function processJsonAgg(
  jsonAggArray: Record<string, any>[],
  caller: string = ''
): Record<string, any>[] {
  const functionName = 'processJsonAgg'
  try {
    return jsonAggArray.map(row => {
      const formattedRow: Record<string, any> = {}
      for (const [key, value] of Object.entries(row)) {
        formattedRow[key.toLowerCase()] = value
      }
      return formattedRow
    })
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return []
  }
}
/** Insert rows from a JSON array file into tableName in batches of 100; returns the total rows inserted. */
export async function table_write_fromJSON(
  filePath: string,
  tableName: string,
  caller: string = ''
): Promise<number> {
  const functionName = 'table_write_fromJSON'
  const BATCH_SIZE = 100
  try {
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: `filePath: ${filePath}, tableName: ${tableName}`,
      lg_severity: 'I'
    })
    if (!fs.existsSync(filePath)) {
      const msg = `File not found: ${filePath}`
      write_Logging({ lg_caller: caller, lg_functionname: functionName, lg_msg: msg, lg_severity: 'E' })
      throw new Error(msg)
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const jsonData = JSON.parse(fileContent)
    if (!Array.isArray(jsonData)) {
      const msg = `JSON data is not an array. Expected an array of objects file ${filePath}`
      write_Logging({ lg_caller: caller, lg_functionname: functionName, lg_msg: msg, lg_severity: 'E' })
      throw new Error(msg)
    }
    if (jsonData.length === 0) {
      const msg = `No data found in the JSON file ${filePath}`
      write_Logging({ lg_caller: caller, lg_functionname: functionName, lg_msg: msg, lg_severity: 'E' })
      throw new Error(msg)
    }
    let totalInserted = 0
    const db = await sql()
    for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
      const batch = jsonData.slice(i, i + BATCH_SIZE)
      const columns = Object.keys(batch[0])
      const column_names = columns.join(', ')
      const values = batch.map(row => Object.values(row))
      const flattenedValues = values.flat()
      const placeholders = values
        .map(
          (_, rowIdx) =>
            `(${columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`).join(', ')})`
        )
        .join(', ')
      const sqlStatement = `
          INSERT INTO ${tableName}
              (${column_names})
              VALUES ${placeholders}
          RETURNING *;
          `
      const result = await db.query({
        caller: '',
        query: sqlStatement,
        params: flattenedValues,
        functionName: functionName
      })
      totalInserted += result?.rowCount || 0
    }
    return totalInserted
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return 0
  }
}

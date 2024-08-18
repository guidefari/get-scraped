// let csvToJson = require('convert-csv-to-json');
import csvToJson from "convert-csv-to-json"
import { deleteEmptyLines } from "./csv-helpers/delete-empty-lines"

const fileInputName = "./csv-renamed/2023-05-01.csv"
const noEmptyLinesFileInputName = "./csv-renamed/2023-05-01-no-empty-lines.csv"
const fileOutputName = "./json/myOutputFile.json"

const withEmptyLinesRemoved = deleteEmptyLines(
  fileInputName,
  noEmptyLinesFileInputName
)

// csvToJson.generateJsonFileFromCsv(fileInputName, fileOutputName)

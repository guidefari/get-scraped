import { Parser } from "@json2csv/plainjs"
import type { Company } from "./types"

const parser = new Parser({})

export const getDateString = (date: string | Date) => {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("en-ZA")
  }
  return date.toLocaleDateString("en-ZA")
}

export function JSONtoCSV(json: Company[]) {
  try {
    return parser.parse(json)
  } catch (err) {
    console.error(err)
    return new Error("Failed to parse JSON")
  }
}

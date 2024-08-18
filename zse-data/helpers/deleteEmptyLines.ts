import { file } from "bun"
import fs from "node:fs"

export async function deleteEmptyLines(filepath: string): Promise<string> {
  try {
    const data = await file(filepath).text()
    const lines = data.split("\n").filter(line => line.slice(-2) !== ",,")
    return lines.join("\n")
  } catch (error) {
    console.error(error)
    throw error
  }
}

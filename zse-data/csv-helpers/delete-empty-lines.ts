import fs from "node:fs"

export function deleteEmptyLines(filename: string, outputFilename: string) {
  fs.readFile(filename, "utf8", (err, data) => {
    if (err) {
      console.error(err)
      return
    }

    const lines = data.split("\n").filter(line => line.slice(-4) !== ",,,,")

    const outputData = lines.join("\n")

    fs.writeFile(outputFilename, outputData, "utf8", err => {
      if (err) {
        console.error(err)
        return
      }

      console.log("Empty lines have been deleted successfully.")
    })
  })
}

console.log("Hello via Bun!")

// const fs = require("fs")
// const path = require("path")

// import fs from "node:fs"
import path from "node:path"

import { promises as fs } from "node:fs"

const directoryPath = "./csv"

// fs.readdir(directoryPath, (err, files) => {
//   if (err) {
//     console.error("Error reading directory:", err)
//     return
//   }

//   const fileNames = files.filter(file =>
//     fs.statSync(path.join(directoryPath, file)).isFile()
//   )

//   console.log(fileNames)
// })

async function copyAndRenameFiles(srcDir: string, destDir: string) {
  try {
    // Ensure destination directory exists
    await fs.mkdir(destDir, { recursive: true })

    // Read all files in the source directory
    const files = await fs.readdir(srcDir)

    // Copy and rename each file
    for (const file of files) {
      const srcFilePath = path.join(srcDir, file)
      const destFilePath = path.join(destDir, dateRename(file))

      // Copy file to the new directory with renamed filename
      await fs.copyFile(srcFilePath, destFilePath)
      console.log(`Copied and renamed: ${srcFilePath} -> ${destFilePath}`)
    }
    console.log("All files copied and renamed successfully.")
  } catch (err) {
    console.error("Error during file copy and rename operation:", err)
  }
}

// Usage
const relativeSrcDir = "./csv"
const relativeDestDir = "./csv-renamed"

copyAndRenameFiles(relativeSrcDir, relativeDestDir)

function dateRename(date: string) {
  const parts = date.split("-")
  const month = parts[0]
  const day = parts[1]
  const year = parts[2].substring(0, 4)

  // // Convert the Date object to locale date string (en-ZA)
  // const localeDateString = inputDate.toLocaleDateString('en-ZA');

  // console.log(localeDateString)

  return `${year}-${month}-${day}.csv`
}

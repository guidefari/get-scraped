import path from "node:path"
import { promises as fs } from "node:fs"
import { dateRename } from "./helpers/dateRename"
import { deleteEmptyLines } from "./helpers/deleteEmptyLines"

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
// const relativeSrcDir = "./csv"
// const relativeDestDir = "./csv-renamed"

// copyAndRenameFiles(relativeSrcDir, relativeDestDir)

async function deleteLines(srcDir: string, destDir: string) {
  try {
    // Ensure destination directory exists
    await fs.mkdir(destDir, { recursive: true })

    // Read all files in the source directory
    const files = await fs.readdir(srcDir)

    // Copy and rename each file
    for (const file of files) {
      const srcFilePath = path.join(srcDir, file)
      const destFilePath = path.join(destDir, file)

      const modifiedFile = await deleteEmptyLines(srcFilePath)

      // write this modified file to the new directory
      await Bun.write(destFilePath, modifiedFile)
      // fs.writeFile(destFilePath, modifiedFile, err => {
      //   if (err) {
      //     console.error(err)
      //     return
      //   }
      // })

      // await fs.copyFile(modifiedFile, destFilePath)

      // Copy file to the new directory with renamed filename
      console.log(`deleted emtpy lines: ${srcFilePath} -> ${destFilePath}`)
    }
    console.log("All files copied and renamed successfully.")
  } catch (err) {
    console.error("Error during file copy and rename operation:", err)
  }
}

const relativeSrcDir = "./csv-renamed"
const relativeDestDir = "./csv-renamed-no-empty-lines"

deleteLines(relativeSrcDir, relativeDestDir)

import path from "node:path"
import { promises as fs } from "node:fs"

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

  return `${year}-${month}-${day}.csv`
}

import { Parser } from "@json2csv/plainjs"
import type { Company } from "./types"

const parser = new Parser({})

type ScrapedDate = {
  year: string
  month: string
  day: string
}

export const getDateString = ({ year, month, day }: ScrapedDate) => {
  const date = `${year}-${monthStringToNumber(month)}-${day}`
  console.log("date:", date)

  if (typeof date === "string") {
    return new Date(date).toISOString()
  }
  // return date.toISOString()
}

export function JSONtoCSV(json: Company[]) {
  try {
    return parser.parse(json)
  } catch (err) {
    console.error(err)
    return new Error("Failed to parse JSON")
  }
}

function monthStringToNumber(monthString: string) {
  const months = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  }

  return months[monthString.toLowerCase()]
}

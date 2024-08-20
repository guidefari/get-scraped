import type { Company } from "./types"
import { JSONtoCSV } from "./util"

export function returnAsCSV(data: Company[]) {
  const csv = JSONtoCSV(data)

  if (csv instanceof Error) {
    return {
      statusCode: 500,
      body: csv.message,
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=zse-${new Date().toISOString()}.csv`,
    },
    body: csv,
  }
}

import { parse } from "node-html-parser"
import { Parser } from "@json2csv/plainjs"
import type { APIGatewayProxyEvent } from "aws-lambda"

const parser = new Parser({})

type Company = {
  CompanyName: string
  OpeningPrice: string
  ClosingPrice: string
  TotalTradedValue: string
}

export async function scrape(event: APIGatewayProxyEvent) {
  const html = await fetch("https://www.zse.co.zw/price-sheet/")
  const document = await html.text()
  const root = parse(document)

  const tableRows = root?.querySelector("table")?.querySelectorAll("tr")
  if (!tableRows) return "No table found👀"

  const data: Company[] = []
  for (let i = 1; i < tableRows.length; i += 1) {
    const columns = tableRows[i].querySelectorAll("td")

    const rowData = {
      CompanyName: columns[0].text.trim(),
      OpeningPrice: columns[1].text.trim(),
      ClosingPrice: columns[2].text.trim(),
      TotalTradedValue: columns[3].text.trim(),
    }

    if (rowData.CompanyName) {
      data.push(rowData)
    }
  }

  const csv = JSONtoCSV(data)

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=zse-${new Date().toISOString()}.csv`,
    },
    body: csv,
  }
}

function JSONtoCSV(json: Company[]) {
  try {
    return parser.parse(json)
  } catch (err) {
    console.error(err)
  }
}

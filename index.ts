import { parse } from "node-html-parser"
import { Parser } from "@json2csv/plainjs"
import type { APIGatewayProxyEvent } from "aws-lambda"
import {
  DynamoDBClient,
  PutItemCommand,
  Put,
  QueryCommand,
  GetItemCommand,
  ScanCommandInput,
  QueryCommandInput,
  ScanCommand,
} from "@aws-sdk/client-dynamodb"
import { Resource } from "sst"
import type { Company, DBWriteRequest } from "./types"
import { getDateString } from "./util"
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb"

const parser = new Parser({})
const dynamoDBClient = new DynamoDBClient()
const dynamoDocumentClient = DynamoDBDocument.from(dynamoDBClient)

export async function scrape(event: APIGatewayProxyEvent) {
  const html = await fetch("https://www.zse.co.zw/price-sheet/")
  const document = await html.text()
  const root = parse(document)
  // console.log("root:", root)

  const tableRows = root?.querySelector("table")?.querySelectorAll("tr")
  if (!tableRows) return "No table found👀"

  const dateParagraph = root?.querySelector(
    'p strong:contains("ZSE PRICE SHEET")'
  )?.innerText

  if (!dateParagraph) return "No date found on the page👀"

  const dateArray = dateParagraph?.split(" ").slice(-3)
  const month = dateArray[1]
  const day = dateArray[0]
  const year = dateArray[2]

  const dateString = getDateString(`${month} ${day}, ${year}`)

  const data: Company[] = []
  for (let i = 1; i < tableRows.length; i += 1) {
    const columns = tableRows[i].querySelectorAll("td")

    const rowData: Company = {
      CompanyName: columns[1].text.trim(),
      OpeningPrice: columns[2].text.trim(),
      ClosingPrice: columns[3].text.trim(),
      TotalTradedVolume: columns[4].text.trim(),
      TotalTradedValue: columns[5].text.trim(),
    }

    if (rowData.CompanyName && rowData.OpeningPrice) {
      data.push(rowData)
    }
  }
  // console.log("data:", data[2])

  await writeLatestToDynamoDB({
    TradingDay: dateString,
    TradingData: data,
  })
}

function JSONtoCSV(json: Company[]) {
  try {
    return parser.parse(json)
  } catch (err) {
    console.error(err)
    return new Error("Failed to parse JSON")
  }
}

function returnAsCSV(data: Company[]) {
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

async function writeLatestToDynamoDB(data: DBWriteRequest) {
  // console.log("data:", data)
  // const requestJSON = JSON.parse(event.body)

  // Make sure to assert that date is in the desire format
  // zod could help

  if (!data) return { statusCode: 500, body: "No data to write" }

  try {
    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: Resource.MyTable.name,
        Item: {
          TradingDay: { S: data.TradingDay },
          TradingData: {
            L: data.TradingData.map(row => ({
              M: {
                CompanyName: { S: row.CompanyName },
                OpeningPrice: { S: row.OpeningPrice },
                ClosingPrice: { S: row.ClosingPrice },
                TotalTradedValue: { S: row.TotalTradedValue },
                TotalTradedVolume: { S: row.TotalTradedVolume },
              },
            })),
          },
        },
        // ConditionExpression: "attribute_not_exists(TradingDay)",
      })
    )

    return {
      statusCode: 200,
      body: "Written to DynamoDB",
    }
  } catch (error) {
    console.error("failed to write to dynamoDB", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }, null, 2),
    }
  }
}

export async function getLatest() {
  // const response = await dynamoDBClient.send(
  //   new ScanCommand({
  //     TableName: Resource.MyTable.name,
  //     // Key: {
  //     //   TradingDay: { S: getDateString(new Date()) },
  //     // }
  //     // KeyConditionExpression: "attribute_exists(TradingDay)",
  //     Limit: 1, // Only get the latest
  //   })
  // )

  const response = await dynamoDocumentClient.scan({
    TableName: Resource.MyTable.name,
    // Key: {
    //   TradingDay: { S: getDateString(new Date()) },
    // }
    // KeyConditionExpression: "attribute_exists(TradingDay)",
    Limit: 1, // Only get the latest
  })

  if (response?.Items?.length === 0) {
    return {
      statusCode: 404,
      body: "No data found",
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(response, null, 2),
  }
}

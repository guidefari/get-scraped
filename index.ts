import { parse } from "node-html-parser"
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
import { getDateString, JSONtoCSV } from "./util"
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb"

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

  const dateString = getDateString({ year, month, day })
  if (!dateString) return "Failed to extract date from the page👀"

  const data: Company[] = []
  for (let i = 1; i < tableRows.length; i += 1) {
    const columns = tableRows[i].querySelectorAll("td")

    const rowData: Company = {
      CompanyName: columns[0]?.text.trim() ?? "",
      OpeningPrice: columns[1]?.text.trim() ?? "",
      ClosingPrice: columns[2]?.text.trim() ?? "",
      TotalTradedVolume: columns[3]?.text.trim() ?? "",
      TotalTradedValue: columns[4]?.text.trim() ?? "",
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

export async function insertItem(event: APIGatewayProxyEvent) {
  if (!event.body) return { statusCode: 400, body: "Request body is empty" }
  const requestJSON = JSON.parse(event.body)

  if (!requestJSON) return { statusCode: 400, body: "JSON is malformed" }

  try {
    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: Resource.MyTable.name,
        Item: {
          TradingDay: { S: requestJSON.TradingDay },
          TradingData: {
            L: requestJSON.TradingData.map(row => ({
              M: {
                CompanyName: { S: row.CompanyName },
                OpeningPrice: { S: row.OpeningPrice },
                ClosingPrice: { S: row.ClosingPrice },
                TotalTradedValue: { S: row.TotalTradedValue || "" },
                TotalTradedVolume: { S: row.TotalTradedVolume || "" },
              },
            })),
          },
        },
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

export async function lastXDays(event: APIGatewayProxyEvent) {
  const days = Number.parseInt(event.pathParameters?.days || "")
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const stringDate = startDate.toISOString()
  console.log("stringDate:", stringDate)

  if (!days) return { statusCode: 400, body: "No days provided" }

  const response = await dynamoDocumentClient.query({
    TableName: Resource.MyTable.name,
    KeyConditionExpression: "TradingDay > :stringDate",
    ExpressionAttributeValues: {
      ":stringDate": stringDate,
    },
  })

  if (response?.Items?.length === 0) {
    return {
      statusCode: 404,
      body: "No data found",
    }
  }
}

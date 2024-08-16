import { Resource } from "sst"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"
import { parse } from "node-html-parser"
import { Parser } from "@json2csv/plainjs"
import type { APIGatewayProxyEvent } from "aws-lambda"

const s3 = new S3Client({})
const parser = new Parser({})

export async function upload() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  })

  return {
    statusCode: 200,
    body: await getSignedUrl(s3, command),
  }
}

export async function latest() {
  const objects = await s3.send(
    new ListObjectsV2Command({
      Bucket: Resource.MyBucket.name,
    })
  )

  const latestFile = objects.Contents!.sort(
    (a, b) =>
      (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0)
  )[0]

  const command = new GetObjectCommand({
    Key: latestFile.Key,
    Bucket: Resource.MyBucket.name,
  })

  return {
    statusCode: 302,
    headers: {
      Location: await getSignedUrl(s3, command),
    },
  }
}

type Company = {
  CompanyName: string
  OpeningPrice: string
  ClosingPrice: string
  TotalTradedValue: string
}

export async function scrape(event: APIGatewayProxyEvent) {
  console.log("event:", event)
  const html = await fetch("https://www.zse.co.zw/price-sheet/")
  // return html.text()
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
  // console.log(csv)

  // console.log(JSON.stringify(data, null, 2));

  // return JSON.stringify(data, null, 2)

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

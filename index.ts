import { Resource } from "sst"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"
import { parse } from "node-html-parser"

const s3 = new S3Client({})

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

export async function scrape() {
  const html = await fetch("https://www.zse.co.zw/price-sheet/")
  // return html.text()
  const document = await html.text()
  const root = parse(document)

  const tableRows = root?.querySelector("table")?.querySelectorAll("tr")

  const data = []
  for (let i = 2; i < tableRows.length; i += 2) {
    const columns = tableRows[i].querySelectorAll("td")

    const rowData = {
      CompanyName: columns[0].text.trim(),
      OpeningPrice: columns[1].text.trim(),
      ClosingPrice: columns[2].text.trim(),
      TotalTradedValue: columns[3].text.trim(),
    }

    data.push(rowData)
  }

  // console.log(JSON.stringify(data, null, 2));

  return JSON.stringify(data, null, 2)
}

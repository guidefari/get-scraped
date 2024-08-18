/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "get-scraped",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    }
  },
  async run() {
    const bucket = new sst.aws.Bucket("MyBucket", {
      public: true,
    })

    const api = new sst.aws.ApiGatewayV2("MyApi")

    const table = new sst.aws.Dynamo("MyTable", {
      fields: {
        // CompanyName: "string",
        TradingDay: "string",
      },
      primaryIndex: {
        hashKey: "TradingDay",
        // rangeKey: "CompanyName",
      },
    })

    api.route("GET /scrape", {
      link: [bucket, table],
      handler: "index.scrape",
    })

    api.route("GET /latest", {
      link: [bucket, table],
      handler: "index.getLatest",
    })

    return {
      api: api.url,
      tableName: table.name,
      tableArn: table.arn,
    }
  },
})

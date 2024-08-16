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

    api.route("GET /scrape", {
      link: [bucket],
      handler: "index.scrape",
    })
  },
})

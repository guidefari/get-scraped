/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
	app(input) {
		return {
			name: "get-scraped",
			removal: input?.stage === "production" ? "retain" : "remove",
			home: "aws",
		};
	},
	async run() {
		const api = new sst.aws.ApiGatewayV2("MyApi");

		const table = new sst.aws.Dynamo("MyTable", {
			fields: {
				// CompanyName: "string",
				TradingDay: "string",
			},
			primaryIndex: {
				hashKey: "TradingDay",
				// rangeKey: "CompanyName",
			},
		});

		api.route("GET /scrape", {
			link: [table],
			handler: "index.scrape",
		});

		api.route("GET /latest", {
			link: [table],
			handler: "index.getLatest",
		});

		api.route("POST /insert", {
			link: [table],
			handler: "index.insertItem",
		});

		api.route("GET /last/{days}", {
			link: [table],
			handler: "index.lastXDays",
		});

		const cron = new sst.aws.Cron("DailyScrape", {
			schedule: "cron(30 15 * * ? *)",
			job: {
				handler: "index.scrape",
				link: [table],
			},
		});

		return {
			api: api.url,
			tableName: table.name,
			tableArn: table.arn,
		};
	},
});

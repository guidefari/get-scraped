export type DBWriteRequest = {
  TradingDay: string
  TradingData: Company[]
}

export type Company = {
  CompanyName: string
  OpeningPrice: string
  ClosingPrice: string
  TotalTradedValue: string
  TotalTradedVolume: string
}

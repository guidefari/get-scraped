export function dateRename(date: string) {
  const parts = date.split("-")
  const month = parts[0]
  const day = parts[1]
  const year = parts[2].substring(0, 4)

  return `${year}-${month}-${day}.csv`
}

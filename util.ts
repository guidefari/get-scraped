export const getDateString = (date: string | Date) => {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("en-ZA")
  }
  return date.toLocaleDateString("en-ZA")
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export function toSentence(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

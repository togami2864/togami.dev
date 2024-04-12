export const formatLocalDate = (
  date: Date,
  lang: "en" | "ja" = "en"
): string => {
  return date.toLocaleDateString(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

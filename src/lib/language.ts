export type Locale = "ja" | "en";
export type ContentLanguage = Locale | "both";

export function isVisibleInLocale(contentLanguage: ContentLanguage, locale: Locale): boolean {
  return contentLanguage === "both" || contentLanguage === locale;
}

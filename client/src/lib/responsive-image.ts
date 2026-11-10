const RESPONSIVE_IMAGE_WIDTHS = [320, 480, 640, 720, 900, 1200, 1600] as const;

function withWidth(src: string, width: number): string {
  const [pathAndQuery, hash] = src.split("#", 2);
  const url = new URL(pathAndQuery, "https://ifix.invalid");
  url.searchParams.set("w", String(width));
  const result = `${url.pathname}${url.search}`;
  return hash ? `${result}#${hash}` : result;
}

/** Build responsive candidates for images served by the site's image optimizer. */
export function getResponsiveImageProps(src: string, sizes: string) {
  if (!/^\/(?:uploads\/products|images)\//.test(src)) return {};

  return {
    src: withWidth(src, 480),
    srcSet: RESPONSIVE_IMAGE_WIDTHS.map((width) => `${withWidth(src, width)} ${width}w`).join(", "),
    sizes,
  };
}

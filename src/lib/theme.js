/**
 * Returns all theme colour/font variables based on dark mode flag.
 * Components destructure what they need from this object.
 */
export function buildTheme(dark) {
  return {
    dark,
    bg:       dark ? "#0f1117" : "#f5f5f2",
    card:     dark ? "#181b24" : "#ffffff",
    sideBg:   dark ? "#13151e" : "#ffffff",
    txt:      dark ? "#e8e8e0" : "#111118",
    sub:      dark ? "#5a5c6a" : "#888898",
    bdr:      dark ? "#1e2232" : "#e8e8e2",
    inputBg:  dark ? "#1e2030" : "#f5f5f0",
    fontBody: "'DM Sans', sans-serif",
    fontMono: "'DM Mono', monospace",
  };
}
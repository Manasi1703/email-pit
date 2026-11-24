// Every sound lives in the audios/ folder at the project root. Drop a file in and ask for it by its name without the extension.
// Vite bundles them, so the urls work in both `npm run dev` and `npm run build`.
const files = import.meta.glob("../audios/*.{wav,mp3,ogg,m4a,flac}", { query: "?url", import: "default", eager: true });
const baseName = path => path.split("/").pop().replace(/\.[^.]+$/, "").toLowerCase();

/** The url of audios/<name>.<any audio extension>, trying each name in turn (an exact file name first, then any file whose name contains it), or null. */
export function audioUrl(...names) {
  const keys = Object.keys(files);
  for (const n of names) { const k = keys.find(p => baseName(p) === n.toLowerCase()) || keys.find(p => baseName(p).includes(n.toLowerCase())); if (k) return files[k]; }
  return null;
}

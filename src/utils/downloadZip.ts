import JSZip from "jszip";
import type { ProjectFiles } from "./projectGenerator";

export async function downloadProjectZip(files: ProjectFiles, zipName: string) {
  const zip = new JSZip();
  const folder = zip.folder(zipName)!;

  for (const [path, content] of Object.entries(files)) {
    // Create subdirectories as needed
    const parts = path.split("/");
    if (parts.length === 1) {
      folder.file(parts[0], content);
    } else {
      let dir = folder;
      for (let i = 0; i < parts.length - 1; i++) {
        dir = dir.folder(parts[i])!;
      }
      dir.file(parts[parts.length - 1], content);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${zipName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

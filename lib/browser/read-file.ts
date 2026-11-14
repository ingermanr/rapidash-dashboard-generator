/** Reads a user-picked file as text. FileReader works in every browser (and in jsdom, which lacks Blob.text). */
export function readFileText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo"))
    reader.readAsText(file)
  })
}

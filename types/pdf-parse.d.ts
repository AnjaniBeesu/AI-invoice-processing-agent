declare module 'pdf-parse' {
  type PDFData = { text: string; numpages?: number; info?: Record<string, unknown> }
  function pdfParse(dataBuffer: Buffer): Promise<PDFData>
  export default pdfParse
}

import PDFParser from 'pdf2json'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'

export async function pdfParse(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser()

    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(errData.parserError)
    })

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      const pages = pdfData.Pages.map((page, index) => ({
        pageNumber: index + 1,
        content: page.Texts.map((textObj) =>
          decodeURIComponent(textObj.R[0]?.T ?? '')
        ).join(' ')
      }))

      resolve(pages)
    })

    pdfParser.parseBuffer(buffer)
  })
}

export async function parsePdfToJson(filePath) {
  const loader = new PDFLoader(filePath, { splitPages: true })
  const docs = await loader.load()

  const jsonPages = docs.map((doc, index) => ({
    pageNumber: index + 1,
    content: doc.pageContent
  }))

  return jsonPages
}

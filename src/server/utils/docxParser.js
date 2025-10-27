import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'

export async function parseDocxToJson(filePath) {
  const loader = new DocxLoader(filePath)
  const docs = await loader.load()

  const jsonPages = docs.map((doc, index) => ({
    pageNumber: index + 1,
    content: doc.pageContent
  }))

  return jsonPages
}
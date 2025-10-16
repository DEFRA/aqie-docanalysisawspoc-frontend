import * as XLSX from 'xlsx'
import { Document, Paragraph, TextRun, Packer } from 'docx'
import { saveAs } from 'file-saver'

window.exportToExcel = function() {
  const wb = XLSX.utils.book_new()
  const content = document.getElementById('markdownRenderer')
  
  const tables = content.querySelectorAll('table')
  
  if (tables.length > 0) {
    tables.forEach((table, index) => {
      const ws = XLSX.utils.table_to_sheet(table)
      const sheetName = `Table_${index + 1}`
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })
  } else {
    const textContent = content.innerText
    const ws = XLSX.utils.aoa_to_sheet([['Analysis Results'], [textContent]])
    XLSX.utils.book_append_sheet(wb, ws, 'Analysis')
  }
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const filename = `document-analysis-${timestamp}.xlsx`
  
  XLSX.writeFile(wb, filename)
}

window.exportToWord = function() {
  const content = document.getElementById('markdownRenderer')
  const textContent = content.innerText
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "Document Analysis Results",
              bold: true,
              size: 32
            })
          ],
          spacing: { after: 400 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: textContent,
              size: 24
            })
          ]
        })
      ]
    }]
  })
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const filename = `document-analysis-${timestamp}.docx`
  
  Packer.toBlob(doc).then(blob => {
    saveAs(blob, filename)
  })
}
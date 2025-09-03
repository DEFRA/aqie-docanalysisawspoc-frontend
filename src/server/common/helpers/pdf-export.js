export function exportToPdf(markdownContent) {
  // eslint-disable-next-line new-cap
  const { jsPDF } = window.jspdf
  // eslint-disable-next-line new-cap
  const pdf = new jsPDF()

  const lines = markdownContent.split('\n')

  let yPosition = 20
  const pageHeight = pdf.internal.pageSize.height
  const margin = 20
  const lineHeight = 6

  pdf.setFontSize(16)
  pdf.text('Document Analysis Results', margin, yPosition)
  yPosition += 15

  pdf.setFontSize(10)

  lines.forEach((line) => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
    }

    const cleanLine = line.replace(/[#*`]/g, '').trim()
    if (cleanLine) {
      const splitLines = pdf.splitTextToSize(
        cleanLine,
        pdf.internal.pageSize.width - 2 * margin
      )
      splitLines.forEach((splitLine) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
        pdf.text(splitLine, margin, yPosition)
        yPosition += lineHeight
      })
    } else {
      yPosition += lineHeight / 2
    }
  })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  pdf.save(`analysis-results-${timestamp}.pdf`)
}

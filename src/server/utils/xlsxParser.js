import * as XLSX from 'xlsx'
import { readFile } from 'fs/promises'

export async function parseXlsxToJson(filePath) {
  try {
    // Read the file
    const buffer = await readFile(filePath)
    
    // Parse the workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    // Process each sheet
    const jsonPages = []
    
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert sheet to JSON - this preserves the tabular structure
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Use first row as header
        defval: '', // Default value for empty cells
        raw: false // Convert values to strings
      })
      
      // Filter out completely empty rows
      const filteredData = jsonData.filter(row => 
        row.some(cell => cell !== null && cell !== undefined && cell !== '')
      )
      
      if (filteredData.length > 0) {
        // Convert to a readable text format
        let content = `Sheet: ${sheetName}\n\n`
        
        if (filteredData.length > 1) {
          // First row as headers
          const headers = filteredData[0]
          const dataRows = filteredData.slice(1)
          
          // Create structured content
          content += `Headers: ${headers.join(' | ')}\n\n`
          
          dataRows.forEach((row, rowIndex) => {
            content += `Row ${rowIndex + 1}:\n`
            headers.forEach((header, colIndex) => {
              const value = row[colIndex] || ''
              content += `  ${header}: ${value}\n`
            })
            content += '\n'
          })
        } else {
          // No headers, just data
          filteredData.forEach((row, rowIndex) => {
            content += `Row ${rowIndex + 1}: ${row.join(' | ')}\n`
          })
        }
        
        jsonPages.push({
          pageNumber: index + 1,
          sheetName,
          content: content.trim(),
          rawData: filteredData // Include raw data for potential further processing
        })
      }
    })
    
    return jsonPages
  } catch (error) {
    console.error('Error parsing Excel file:', error)
    throw new Error(`Failed to parse Excel file: ${error.message}`)
  }
}

export async function parseXlsxToStructuredJson(filePath) {
  try {
    const buffer = await readFile(filePath)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    const sheets = {}
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        raw: false 
      })
      
      sheets[sheetName] = jsonData
    })
    
    return sheets
  } catch (error) {
    console.error('Error parsing Excel file to structured JSON:', error)
    throw new Error(`Failed to parse Excel file: ${error.message}`)
  }
}
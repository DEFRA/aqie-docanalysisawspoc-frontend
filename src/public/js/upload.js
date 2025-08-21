document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('policyPdf')
  const fileInfo = document.getElementById('fileInfo')
  const fileNameSpan = document.getElementById('fileName')
  const uploadForm = document.getElementById('uploadForm')
  const progressContainer = document.getElementById('progressContainer')
  const fileSpinner = document.getElementById('fileSpinner')
  const markdownContent = document.getElementById('markdownContent')

  // The markdown content is now rendered server-side

  // When the file input changes (user selects a file)
  fileInput.addEventListener('change', function () {
    // Show spinner immediately when a file is selected
    if (fileInput.files.length > 0) {
      // Show spinner and wait cursor
      fileSpinner.style.display = 'inline-block'
      document.body.style.cursor = 'wait'

      // Simulate a delay for file processing
      setTimeout(function () {
        // Hide spinner after "processing"
        fileSpinner.style.display = 'none'
        document.body.style.cursor = 'default'

        // Now show the file info
        if (fileInput.files[0].type === 'application/pdf') {
          fileInfo.style.display = 'block'
          fileNameSpan.textContent = fileInput.files[0].name
          // Hide any previous analysis results
          markdownContent.style.display = 'none'
        } else {
          fileInfo.style.display = 'none'
          fileNameSpan.textContent = ''
        }
      }, 1000)
    } else {
      // No file was selected
      fileInfo.style.display = 'none'
      fileNameSpan.textContent = ''
    }
  })

  uploadForm.addEventListener('submit', function () {
    if (
      fileInput.files.length &&
      fileInput.files[0].type === 'application/pdf'
    ) {
      // Clear previous markdown content
      if (markdownContent) {
        markdownContent.style.display = 'none'
        const markdownRenderer = document.getElementById('markdownRenderer')
        if (markdownRenderer) {
          markdownRenderer.innerHTML = ''
        }
      }

      // Show loading message
      const loadingMessage = document.getElementById('loadingMessage')
      if (loadingMessage) {
        loadingMessage.style.display = 'block'
      }

      document.body.style.cursor = 'wait'

      const submitButton = uploadForm.querySelector('button[type="submit"]')
      if (submitButton) {
        submitButton.disabled = true
      }
    }
  })
})

import marked from 'marked'

document.addEventListener('DOMContentLoaded', function () {
  const progressContainer = document.getElementById('progressContainer')
  const progressBar = document.getElementById('progressBar')
  const progressStatus = document.getElementById('progressStatus')
  const markdownContent = document.getElementById('markdownContent')
  const markdownRenderer = document.getElementById('markdownRenderer')

  if (
    progressContainer &&
    window.getComputedStyle(progressContainer).display !== 'none'
  ) {
    console.log('Processing mode detected')

    const steps = [
      { progress: 10, message: 'Reading PDF content...' },
      { progress: 25, message: 'Extracting text from pages...' },
      { progress: 40, message: 'Analyzing document structure...' },
      { progress: 55, message: 'Identifying tables and figures...' },
      { progress: 70, message: 'Processing metadata...' },
      { progress: 85, message: 'Formatting results...' },
      { progress: 95, message: 'Finalizing analysis...' }
    ]

    let currentStep = 0

    // Function to update to the next step
    const updateToNextStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep]
        progressBar.value = step.progress
        progressStatus.textContent = step.message
        currentStep++
      }
    }

    // Start with the first step
    updateToNextStep()

    // Update progress every 2 seconds
    const progressInterval = setInterval(updateToNextStep, 2000)

    // Poll for results
    const checkResults = async () => {
      try {
        const response = await fetch('/api/parse-status')
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const data = await response.json()

        if (data.status === 'success') {
          // Complete the progress bar
          clearInterval(progressInterval)
          progressBar.value = 100
          progressStatus.textContent = 'Analysis complete!'

          // Show the results
          setTimeout(() => {
            progressContainer.style.display = 'none'

            // Display markdown content
            if (data.markdownContent) {
              markdownContent.style.display = 'block'

              // Use marked directly to parse the markdown
              markdownRenderer.innerHTML = marked.parse(data.markdownContent)

              // Apply GOV.UK styling to tables
              document
                .querySelectorAll('#markdownRenderer table')
                .forEach((table) => {
                  table.classList.add('govuk-table')
                  table.querySelectorAll('thead').forEach((thead) => {
                    thead.classList.add('govuk-table__head')
                  })
                  table.querySelectorAll('tbody').forEach((tbody) => {
                    tbody.classList.add('govuk-table__body')
                  })
                  table.querySelectorAll('th').forEach((th) => {
                    th.classList.add('govuk-table__header')
                  })
                  table.querySelectorAll('td').forEach((td) => {
                    td.classList.add('govuk-table__cell')
                  })
                })
            }
          }, 1000)

          return
        }

        // If still processing, check again in a moment
        setTimeout(checkResults, 2000)
      } catch (error) {
        console.error('Error checking processing status:', error)
        progressStatus.textContent = 'Error: ' + error.message
        clearInterval(progressInterval)
      }
    }

    // Start checking for results
    setTimeout(checkResults, 2000)
  }
})

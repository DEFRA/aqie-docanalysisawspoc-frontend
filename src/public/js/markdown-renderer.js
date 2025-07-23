import marked from 'marked'

document.addEventListener('DOMContentLoaded', function () {
  const markdownContent = document.getElementById('markdownContent')
  const markdownRenderer = document.getElementById('markdownRenderer')

  window.renderMarkdown = function (content) {
    if (!content) return

    markdownContent.style.display = 'block'
    markdownRenderer.innerHTML = marked.parse(content)

    // if (window.hljs) {
    //   document.querySelectorAll('pre code').forEach((block) => {
    //     hljs.highlightBlock(block);
    //   });
    // }

    document.querySelectorAll('table').forEach((table) => {
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
})

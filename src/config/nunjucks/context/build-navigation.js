export function buildNavigation(request) {
  return [
    {
      text: 'Policy Summarizer',
      href: '/upload',
      current: request?.path === '/upload'
    },
    {
      text: 'Logout',
      href: '/logout',
      current: false
    }
  ]
}

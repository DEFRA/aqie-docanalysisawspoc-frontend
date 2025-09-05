export function buildNavigation(request) {
  return [
    {
      text: 'Policy Summarizer',
      href: '/basic',
      current: request?.path === '/basic'
    },
    {
      text: 'Logout',
      href: '/logout',
      current: false
    }
  ]
}

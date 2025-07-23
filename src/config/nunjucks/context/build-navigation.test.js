import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      { text: 'Upload', href: '/', current: true },
      { text: 'Logout', href: '/logout', current: false }
    ])
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
      { text: 'Upload', href: '/', current: true },
      { text: 'Logout', href: '/logout', current: false }
    ])
  })
})

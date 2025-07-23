/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 */
export const uploadController = {
  handler(_request, h) {
    return h.view('upload/index', {
      pageTitle: 'Upload',
      heading: 'Upload'
    })
  }
}

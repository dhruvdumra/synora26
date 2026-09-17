// CloudFront Function (viewer request) on the default behaviour.
// The site is a single-page app: any path without a file extension must serve index.html, while
// /api/* is handled by its own behaviour pointing at EC2 and never reaches this function.
// Using a function instead of custom error responses keeps real API 404s as 404s.
function handler(event) {
  var request = event.request
  var uri = request.uri

  if (uri.endsWith('/')) {
    request.uri = '/index.html'
    return request
  }

  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1)
  if (lastSegment.indexOf('.') === -1) {
    request.uri = '/index.html'
  }

  return request
}

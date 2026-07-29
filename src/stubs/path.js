/**
 * Browser stub for Node's "path" module.
 * Used by Cornerstone codec packages that check for Node; in browser this is never used.
 */
function noop() {
  return '';
}
module.exports = { join: noop, resolve: noop, dirname: noop, basename: noop };

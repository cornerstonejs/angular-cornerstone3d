/**
 * Browser stub for Node's "fs" module.
 * Used by Cornerstone codec packages that check for Node; in browser this is never used.
 */
module.exports = { readFileSync: () => '', existsSync: () => false };

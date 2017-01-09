export function assert(val, msg) {
  if (!val) {
    throw new Error(msg || 'assert')
  }
  return val
}

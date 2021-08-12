/**
 * Check if an object is a dictionary
 * @param object Object to check
 * @returns `true` if the object is a dictionary
 */
export function isDict(object: any): object is Record<string, unknown> {
  return (
    typeof object === 'object' &&
    object !== null &&
    object !== undefined &&
    !(object instanceof Array) &&
    !(object instanceof Date)
  );
}

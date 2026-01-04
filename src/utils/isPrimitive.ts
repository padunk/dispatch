export function isPrimitive(value: any): boolean {
  return value !== null && value !== undefined && typeof value !== "object";
}

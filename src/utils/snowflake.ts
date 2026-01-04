export function snowflake(stateName: string) {
  let id = 0;
  const ts = Date.now();
  const stateId = btoa(stateName);
  const sequence = id++;

  return () => `${ts}${stateId}${sequence.toString(16)}`;
}

export function parseInteger(
  value: string,
  name: string,
  defaultValue: number
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    console.warn(
      `Invalid ${name}, (must be a number) using default (${defaultValue})`
    );
    return defaultValue;
  }

  if (parsed <= 0) {
    console.warn(
      `${name} must be greater than 0, using default (${defaultValue})`
    );
    return defaultValue;
  }

  return parsed;
}

export function validatePassword(value: string): [string, boolean] {
  if (typeof value !== 'string') {
    return ['Password is not a string.', false];
  }

  if (!value || value.length < 1) {
    return ['Password can not be empty', false];
  }

  const invalidChars = [...value].filter((char) => {
    const code = char.charCodeAt(0);
    return code < 32 || code > 126;
  });

  if (invalidChars.length > 0) {
    return [
      `The password contains invalid characters. (${invalidChars.join(', ')})`,
      false,
    ];
  }

  if (value.length > 32) {
    return ['The password cannot be longer than 32 characters.', false];
  }

  return ['', true];
}

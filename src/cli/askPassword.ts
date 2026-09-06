import prompts from 'prompts';
import { validatePassword } from '../utils/passwordValidator';

export async function askPassword() {
  let password = '';

  const result = await prompts([
    {
      type: 'confirm',
      name: 'requestPassword',
      message: 'Do you want to password-protect?',
    },
    {
      type: (prev) => (prev ? 'password' : null),
      name: 'password',
      message: 'Write a password',
      validate: (value) => {
        const [error, isValid] = validatePassword(value);
        if (!isValid) {
          return error;
        }
        password = value;
        return true;
      },
    },
    {
      type: (prev) => (prev ? 'password' : null),
      name: 'passwordConfirm',
      message: 'Confirm the password',
      validate: (value) => {
        const [error, isValid] = validatePassword(value);
        if (!isValid) {
          return error;
        }
        if (value !== password) {
          return 'Password does not match the previous one.';
        }
        return true;
      },
    },
  ]);

  if (!result.requestPassword || result.password !== result.passwordConfirm) {
    return null;
  }
  return result.password;
}

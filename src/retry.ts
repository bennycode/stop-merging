import {wait} from './wait';

export function retry<T>(
  action: () => Promise<T>,
  retries = Infinity,
  timeout = 0,
  error: {message: string} = new Error('Function exceeded amount of retries.')
): Promise<T> {
  if (!retries) {
    console.log(error.message);
    console.log('All retries used.');
    return Promise.reject(error);
  }
  return action().catch(error => {
    retries -= 1;
    return wait(timeout).then(() => {
      return retry(action, retries, timeout, error);
    });
  });
}

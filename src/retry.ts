import {wait} from './wait';
import {AbortError} from './AbortError';

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
    if (error instanceof AbortError) {
      throw error;
    }
    retries -= 1;
    console.log(`Checking again in "${timeout}ms"... Retries left: ${retries}`);
    return wait(timeout).then(() => {
      return retry(action, retries, timeout, error);
    });
  });
}

import {wait} from './wait';

let globalVar = 0;

const myAction = () =>
  new Promise<void>((resolve, reject) => {
    if (globalVar < 10) {
      globalVar += 1;
      console.log('globalVar', globalVar);
      reject(new Error('BOO'));
    } else {
      resolve();
    }
  });

export function retry<T>(
  action: () => Promise<T>,
  retries = Infinity,
  timeout = 0,
  error: unknown = new Error('Function exceeded amount of retries.')
): Promise<T> {
  if (!retries) {
    return Promise.reject(error);
  }
  return action().catch((error: unknown) => {
    console.log('trying again');
    return wait(timeout).then(() => {
      return retry(action, retries - 1, timeout, error);
    });
  });
}

retry<void>(myAction, 11, 1000).catch(console.error);

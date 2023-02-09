import {retry} from './retry';
import {AbortError} from './AbortError';

describe('retry', () => {
  it('retries', async () => {
    const maxRuns = 3;
    let run = 1;

    const myAction = () =>
      new Promise<void>((resolve, reject) => {
        if (run < maxRuns) {
          run += 1;
          reject(new Error('I am not satisfied.'));
        } else {
          resolve();
        }
      });

    const spiedAction = jest.fn(myAction);
    await retry<void>(spiedAction, maxRuns, 1000);
    expect(run).toBe(maxRuns);
    expect(spiedAction).toHaveBeenCalledTimes(maxRuns);
  });

  it('allows to abort retries', async () => {
    const maxRuns = 3;
    const myAction = () => Promise.reject(new AbortError("Don't retry!"));
    const spiedAction = jest.fn(myAction);
    await expect(retry<void>(spiedAction, maxRuns, 1000)).rejects.toThrow("Don't retry!");
    expect(spiedAction).toHaveBeenCalledTimes(1);
  });
});

import {retry} from './retry';

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
});

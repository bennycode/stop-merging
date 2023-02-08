import {wait} from './wait';

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe('wait', () => {
  it('sets a timeout', async () => {
    const timeout = 5000;
    void wait(timeout);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), timeout);
  });
});

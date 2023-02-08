import {CheckSuites, filterCompletedCheckSuites} from './filterCompletedCheckSuites';
import checkSuiteResponse from './check_suites.json';

describe('filterCompletedCheckSuites', () => {
  it('filters completed check suites', () => {
    const suites = filterCompletedCheckSuites(checkSuiteResponse.data.check_suites as CheckSuites, 'main');
    expect(suites.length).toBe(0);
  });
});

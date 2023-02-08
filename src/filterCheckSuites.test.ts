import {CheckSuites, filterCheckSuites} from './filterCheckSuites';
import checkSuiteResponse from './check_suites.json';

const checkSuites = checkSuiteResponse.data.check_suites as CheckSuites;

describe('filterCheckSuites', () => {
  it('finds completed check suites', () => {
    const suites = filterCheckSuites(checkSuites, 'main', 'completed');
    expect(suites.length).toBe(2);
  });

  it('finds pending check suites', () => {
    const suites = filterCheckSuites(checkSuites, 'main', 'in_progress');
    expect(suites.length).toBe(1);
  });
});

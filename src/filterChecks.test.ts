import {CheckSuites, filterChecks} from './filterChecks';
import checkSuiteResponse from './check_suites.json';

const checkSuites = checkSuiteResponse.data.check_suites as CheckSuites;

describe('filterChecks', () => {
  it('finds completed checks', () => {
    const suites = filterChecks(checkSuites, 'main', 'completed');
    expect(suites.length).toBe(2);
  });

  it('finds pending checks', () => {
    const suites = filterChecks(checkSuites, 'main', 'in_progress');
    expect(suites.length).toBe(1);
  });
});

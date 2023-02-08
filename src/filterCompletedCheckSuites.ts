import type {components} from '@octokit/openapi-types';

export type CheckSuites = components['schemas']['check-suite'][];

export function filterCompletedCheckSuites(checkSuites: CheckSuites, gitBranch: string): CheckSuites {
  return checkSuites
    .filter(suite => {
      return !!suite.conclusion && suite.head_branch === gitBranch && suite.status === 'completed';
    })
    .sort((a, b) => a.id - b.id);
}

import type {components} from '@octokit/openapi-types';

export type CheckSuite = components['schemas']['check-suite'];
export type CheckSuites = CheckSuite[];

export function filterChecks(checkSuites: CheckSuites, gitBranch: string, status: CheckSuite['status']) {
  return checkSuites
    .filter(suite => suite.head_branch === gitBranch && suite.status === status)
    .sort((a, b) => a.id - b.id);
}

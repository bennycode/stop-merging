import type {CheckSuites} from './filterChecks';
import {AbortError} from './AbortError';
import type {RepositoryInfo} from './RepositoryInfo';

export function assertChecks(
  checkSuitesPayload: {
    check_suites: CheckSuites;
    total_count: number;
  },
  {repo, owner, gitBranch}: RepositoryInfo
) {
  const statusUpdates = checkSuitesPayload.check_suites.map(suite => suite.status);
  console.log(
    `Found "${checkSuitesPayload.total_count}" check suite(s) (${statusUpdates.join(
      ', '
    )}) for repository "${repo}" owned by "${owner}".`
  );

  if (checkSuitesPayload.total_count === 0) {
    const errorMessage = `There are no required status checks for branch "${gitBranch}" of repository "${owner}/${repo}". Please have a look at: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks`;
    throw new AbortError(errorMessage);
  }
}

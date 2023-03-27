import type {GitHub} from '@actions/github/lib/utils';
import type {CheckSuite} from './filterChecks';
import type {RepositoryInfo} from './RepositoryInfo';
import {assertChecks} from './assertChecks';

/**
 * Iterates over all check suites and resolves once the latest check suite is complete.
 */
export async function fetchCompletedCheck(
  octokit: InstanceType<typeof GitHub>,
  {owner, gitBranch, repo}: RepositoryInfo
): Promise<CheckSuite> {
  return new Promise(async (resolve, reject) => {
    // Checks API
    // https://docs.github.com/en/rest/checks/suites#list-check-suites-for-a-git-reference
    const {data: checkSuitesPayload} = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/check-suites', {
      owner,
      ref: gitBranch,
      repo,
    });

    if (process.env.NODE_DEBUG === 'silly') {
      require('fs').writeFileSync(`dump-${Date.now()}.json`, JSON.stringify(checkSuitesPayload));
    }

    assertChecks(checkSuitesPayload, {gitBranch, owner, repo});

    const checks = checkSuitesPayload.check_suites;
    const latestCheck = checks[checks.length - 1];
    const isComplete = latestCheck.status === 'completed';

    if (isComplete) {
      console.log(`Found completed check suite on branch "${gitBranch}".`);
      resolve(latestCheck);
    } else {
      const error = new Error('Waiting for check runs to finish...');
      reject(error);
    }
  });
}

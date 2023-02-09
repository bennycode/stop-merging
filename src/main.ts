import * as core from '@actions/core';
import * as github from '@actions/github';
import type {GitHub} from '@actions/github/lib/utils';
import {retry} from './retry';
import {AbortError} from './AbortError';
import type {CheckSuite, CheckSuites} from './filterChecks';

type RepositoryInfo = {
  gitBranch: string;
  owner: string;
  repo: string;
};

function assertChecks(
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

/**
 * Iterates over all check suites and resolves once the latest check suite is complete.
 */
async function fetchCompletedCheck(
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

async function run(): Promise<void> {
  const ONE_MINUTE_IN_MILLIS = 60_000;

  const bypassPrefix = process.env.CI ? core.getInput('BYPASS_PREFIX') : process.env.BYPASS_PREFIX;
  const gitBranch = process.env.CI ? core.getInput('GIT_BRANCH') : process.env.GIT_BRANCH;

  const prTitle = github.context.payload.pull_request?.title || '';
  const {owner, repo} = github.context.repo;

  // Authentication
  // https://github.com/actions/toolkit/tree/main/packages/github#usage
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const githubToken = process.env.CI ? core.getInput('GITHUB_TOKEN', {required: true}) : process.env.GITHUB_TOKEN;
  const octokit = github.getOctokit(`${githubToken}`);

  try {
    if (!prTitle && process.env.CI) {
      console.log(
        `Skipping checks because action was not triggered in the context of a Pull Request on the CI environment.`
      );
      process.exit(0);
    }

    const latestRun = await retry(
      () => {
        return fetchCompletedCheck(octokit, {
          gitBranch: `${gitBranch}`,
          owner,
          repo,
        });
      },
      Infinity,
      ONE_MINUTE_IN_MILLIS
    );

    const commitUrl = `https://github.com/${owner}/${repo}/commit/${latestRun.head_sha}`;

    console.log(
      `Latest check suite with ID "${latestRun.id}" ("${latestRun.status}/${
        latestRun.conclusion
      }") on branch "${gitBranch}" ran with commit SHA "${latestRun.head_sha}" at "${new Date(
        latestRun.head_commit.timestamp
      ).toISOString()}": ${commitUrl}`
    );

    // Check if there is a broken branch and if the PR addresses this with a commit that can bypass the status check
    const bypassMergeCheck = prTitle.startsWith(bypassPrefix);

    if (latestRun.conclusion === 'failure' && !bypassMergeCheck) {
      const errorMessage = `CI status check on branch "${gitBranch}" failed with this commit from "${latestRun.head_commit.author?.name}": ${commitUrl}`;
      throw new Error(errorMessage);
    } else {
      console.log(`Matched check suite with ID "${latestRun.id}" has status "${latestRun.conclusion}".`);
    }

    if (bypassMergeCheck) {
      console.log(`Mergeability was granted because PR title matches bypass prefix`);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error);
      console.error(error);
    }
  }
}

void run();

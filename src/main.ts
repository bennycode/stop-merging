import ms from 'ms';
import * as core from '@actions/core';
import * as github from '@actions/github';
import type {GitHub} from '@actions/github/lib/utils';
import {retry} from './retry';
import {CheckSuites, filterCompletedCheckSuites} from './filterCompletedCheckSuites';

async function checkSuites(
  octokit: InstanceType<typeof GitHub>,
  {
    owner,
    gitBranch,
    repo,
  }: {
    gitBranch: string;
    owner: string;
    repo: string;
  }
): Promise<CheckSuites> {
  return new Promise(async (resolve, reject) => {
    // Checks API
    // https://docs.github.com/en/rest/checks/suites#list-check-suites-for-a-git-reference
    const {data: checkSuitesPayload} = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/check-suites', {
      owner,
      ref: gitBranch,
      repo,
    });

    console.log(`Found "${checkSuitesPayload.total_count}" check suites for repository "${repo}" owned by "${owner}".`);

    // Find completed check runs
    const completedCheckSuites = filterCompletedCheckSuites(checkSuitesPayload.check_suites, gitBranch);

    if (completedCheckSuites.length === 0) {
      const errorMessage = `There are no completed check suites on branch "${gitBranch}". Check suites are either pending or didn't run at all. You can read more about check suites here: https://docs.github.com/en/rest/guides/getting-started-with-the-checks-api#about-check-suites`;
      const error = new Error(errorMessage);
      reject(error);
    } else {
      console.log(`Found "${completedCheckSuites.length}" completed check suites on branch "${gitBranch}".`);
      resolve(completedCheckSuites);
    }
  });
}

async function run(): Promise<void> {
  // PR Title Check
  const title = github.context.payload.pull_request?.title;
  const {owner, repo} = github.context.repo;
  const bypassPrefix = process.env.CI ? core.getInput('BYPASS_PREFIX') : process.env.BYPASS_PREFIX;
  const gitBranch = process.env.CI ? core.getInput('GIT_BRANCH') : process.env.GIT_BRANCH;
  const retries = process.env.CI ? core.getInput('STATUS_CHECK_RETRIES') : process.env.STATUS_CHECK_RETRIES;
  const timeout = process.env.CI ? core.getInput('STATUS_CHECK_TIMEOUT') : process.env.STATUS_CHECK_TIMEOUT;

  // Authentication
  // https://github.com/actions/toolkit/tree/main/packages/github#usage
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const githubToken = process.env.CI ? core.getInput('GITHUB_TOKEN', {required: true}) : process.env.GITHUB_TOKEN;
  const octokit = github.getOctokit(`${githubToken}`);

  try {
    if (!title && process.env.CI) {
      console.log(
        `Skipping checks because action was not triggered in the context of a Pull Request on the CI environment.`
      );
      process.exit(0);
    }

    const completedCheckSuites = await retry(
      () => {
        return checkSuites(octokit, {
          gitBranch: `${gitBranch}`,
          owner,
          repo,
        });
      },
      parseInt(`${retries}`, 10),
      ms(`${timeout}`)
    );

    const latestRun = completedCheckSuites[completedCheckSuites.length - 1];

    const commitUrl = `https://github.com/${owner}/${repo}/commit/${latestRun.head_sha}`;

    console.log(
      `Latest check suite with ID "${latestRun.id}" on branch "${gitBranch}" ran with commit SHA "${
        latestRun.head_sha
      }" at "${new Date(latestRun.head_commit.timestamp).toISOString()}": ${commitUrl}`
    );

    // Check if there is a broken branch and if the PR addresses this with a commit that can bypass the status check
    const bypassMergeCheck = title.startsWith(bypassPrefix);

    if (latestRun.conclusion === 'failure' && !bypassMergeCheck) {
      const errorMessage = `CI status check on branch "${gitBranch}" broke by this commit from "${latestRun.head_commit.author?.name}": ${commitUrl}`;
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

import * as core from '@actions/core';
import * as github from '@actions/github';

async function run(): Promise<void> {
  try {
    // PR Title Check
    const title = github.context.payload.pull_request?.title;

    if (!title) {
      console.log(`Skipping checks because action was not triggered in the context of a Pull Request.`);
      process.exit(0);
    }

    // Repository info
    const {owner, repo} = github.context.repo;
    const gitBranch = core.getInput('GIT_BRANCH');

    // Authentication
    // https://github.com/actions/toolkit/tree/main/packages/github#usage
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const githubToken = core.getInput('GITHUB_TOKEN', {required: true});
    const octokit = github.getOctokit(githubToken);

    // Further configuration
    const bypassPrefix = core.getInput('BYPASS_PREFIX');

    // Checks API
    // https://docs.github.com/en/rest/checks/suites#list-check-suites-for-a-git-reference
    const {data: checkSuitesPayload} = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/check-suites', {
      owner,
      ref: gitBranch,
      repo,
    });

    console.log(`Found "${checkSuitesPayload.total_count}" check suites for repository "${repo}" owned by "${owner}".`);

    // Find completed check runs
    const completedCheckSuites = checkSuitesPayload.check_suites
      .filter(suite => {
        return !!suite.conclusion && suite.head_branch === gitBranch && suite.status === 'completed';
      })
      .sort((a, b) => a.id - b.id);

    if (completedCheckSuites.length === 0) {
      console.log(
        `There are no completed check suites on branch "${gitBranch}". You can read more about check suites here: https://docs.github.com/en/rest/guides/getting-started-with-the-checks-api#about-check-suites`
      );
      process.exit(0);
    } else {
      console.log(`Found "${completedCheckSuites.length}" completed check suites on branch "${gitBranch}".`);
    }

    const latestRun = completedCheckSuites[completedCheckSuites.length - 1];

    const commitUrl = `https://github.com/${owner}/${repo}/commit/${latestRun.head_sha}`;

    console.log(
      `Latest check suite with ID "${latestRun.id}" on branch "${gitBranch}" ran with commit SHA "${
        latestRun.head_sha
      }" at "${new Date(latestRun.head_commit.timestamp).toISOString()}": ${commitUrl}`
    );

    // Check if there is a broken branch and if the PR addresses this with a commit that can bypass the status check
    if (latestRun.conclusion === 'failure' && !title.startsWith(bypassPrefix)) {
      const errorMessage = `CI status check on branch "${gitBranch}" broke by this commit from "${latestRun.head_commit.author?.name}": ${commitUrl}`;
      throw new Error(errorMessage);
    } else {
      console.log(`Check suite with ID "${latestRun.id}" did not fail but was "${latestRun.conclusion}".`);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
      console.error(error);
    }
  }
}

void run();

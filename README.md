# Stop Merging

This action performs a status check to prevent merging pull requests into the main branch when it is in a broken state.

## Problem statement

When multiple developers are simultaneously working on the same repository, it can occur that developer A breaks the main branch, but developers B and C continue to merge their PRs into the same branch. This can result in developers B and C being unaware if they have introduced additional bugs, since the main branch is already broken by developer A.

To prevent the above scenario, it may be useful to implement a **code freeze** on the main branch, allowing developer A to resolve the issue without encountering additional merge conflicts or bugs introduced by developers B and C.

This GitHub action represents such code freeze by using a status check that blocks all pull request merges unless they comply with a specific prefix (i.e. "[fix](https://www.conventionalcommits.org/en/v1.0.0/#specification)").

## What means "broken"?

When the latest commit on your main branch has a failed [status check](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks), it is considered to be in a broken state.

## How to install?

1. [Install this action](https://github.com/marketplace/actions/stop-merging) from the GitHub Marketplace
2. [Add branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches) rule to your GitHub repository
3. [Require status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/troubleshooting-required-status-checks) to pass before merging

### 1. Install this action

It's as simple as creating this file:

**.github/workflows/stop-merging.yml**

```yml
name: 'Check Mergeability'

on:
  pull_request:
    # With "edited" it runs on PR title updates
    types: [opened, edited, synchronize, reopened]

jobs:
  check-main:
    runs-on: ubuntu-latest
    steps:
      - uses: bennycode/stop-merging@v0.1.3
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GIT_BRANCH: 'main'
          BYPASS_PREFIX: 'fix'
```

### 2. Add branch protection

Equip your base branch with branch protection rules:

![](https://raw.githubusercontent.com/bennycode/stop-merging/main/img/branch-protection-rules.png)

### 3. Require status checks

Enable "**Require status checks to pass before merging**" and make sure to have at least two status checks:

1. A test suite to determine if your branch is broken (i.e. "test")
2. The "Stop Merging" check (i.e. "check-main")

It is also recommended to enable "**Require branches to be up to date before merging**". This will handle the following scenario:

- Main branch is okay
- Coder A creates a PR that passes the "Stop Merging" check
- Coder B breaks the main branch
- Coder A's merge would still be possible if there was no requirement to keep the branch up to date

**Screenshot:**

![](https://raw.githubusercontent.com/bennycode/stop-merging/main/img/status-checks.png)

## How to use?

When configured as a status check, this action will make your open pull requests fail when your configured main branch is broken. Only pull requests matching a specific title (for example "fix: Main branch") will be allowed to be merged in order to recover the health of your main branch. Once your main branch is green again, you can rerun the failing Stop Merging status checks to also become green again or update your branch which will automatically trigger this action.

## Configuration

The following parameters can be configured:

- `GITHUB_TOKEN`: Token to be used by the Stop Merging action to authenticate with your repository
- `GIT_BRANCH`: Git branch to check for status (defaults to **main**)
- `BYPASS_PREFIX`: Prefix for commit messages that can bypass the status check (defaults to **fix**)

Example:

```yml
steps:
  - uses: bennycode/stop-merging
    with:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      GIT_BRANCH: 'main'
      BYPASS_PREFIX: 'important'
```

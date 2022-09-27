# Stop Merging

This action provides a status check to stop merging Pull Requests into your main branch, when your main branch is broken.

## Problem statement

When multiple developers work actively on the same repository, it can happen that developer A breaks the main branch but developer B and C are still merging their PRs into the main branch. Developer B and C won't be notified if they introduced additional bugs as the branch is already broken by developer A. It can therefore be beneficial to create a code freeze on the main branch so that developer A can provide a fix without running into additional merge conflicts or bugs introduced by developer B and C.

## What means "broken"?

Your main branch is considered to be broken, when the latest commit on this branch has a failing status check.

## How to install?

1. Install this action from the GitHub Marketplace
2. Require status checks to pass before merging
3. Add this action as a required status check

## How to use?

When configured as a status check, this action will make your open Pull Requests fail when your configured main branch is broken. Only Pull Requests matching a specific title (for example "fix: Main branch") will be allowed to be merged in order to recover the health of your main branch. Once your main branch is green again, you can rerun the failing Stop Merging status checks to also become green again.

## Release

1. Code gets compiled and bundled together with all its dependencies into a single file using `ncc`
2. The bundled file is being referenced in `action.yml`

## References

- [GitHub Actions](https://github.com/features/actions)
- [Commit Statuses](https://docs.github.com/rest/commits/statuses)
- [Check Suites](https://docs.github.com/rest/checks/suites)
- [Template for TypeScript Action with tests](https://github.com/actions/typescript-action)

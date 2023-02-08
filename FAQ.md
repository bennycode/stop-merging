## Local Development

### Runtime Test

- Create a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#creating-a-personal-access-token-classic) for GitHub and add it with the key of `GITHUB_TOKEN` to a local `.env` file
- Run `yarn start`

## Release Process

1. Code gets compiled and bundled together with all its dependencies into a single file using `ncc`
2. The bundled file is being referenced in [action.yml](./action.yml)
3. Bundled code is uploaded to the repository
4. New version gets semantically tagged in Git and released on GitHub

## References

- [GitHub Actions](https://github.com/features/actions)
- [Commit Statuses](https://docs.github.com/rest/commits/statuses)
- [Check Suites](https://docs.github.com/rest/checks/suites)
- [TypeScript Template for GitHub Action](https://github.com/actions/typescript-action)

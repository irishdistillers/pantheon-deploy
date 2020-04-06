This GitHub Action syncs your current issue branch to a remote Pantheon repo, using NodeJS.

# Configuration

Pass configuration with `env` vars

- `PANTHEON_MACHINE_TOKEN` [required]

Pantheon Machine Token to be used in Terminus

- `REMOTE_REPO_URL` [required]

Remote GIT Repo URL

- `REMOTE_REPO_NAME` [required]

Remote GIT Repo Name

- `PR_STATE` [required]

State of the PR that triggered the action

- `STRICT_BRANCH_NAMES` [optional]

Set to strict to enforce Jira ticket naming for branches (`none` by default)

# Dependencies

This Github actions required that you:

- Add an private SSH key in the SSH-agent and copy the public associated SSH key into Pantheon

- Use a Github action that install Terminus E.g: https://github.com/kopepasah/setup-pantheon-terminus

# Usage

```
  - name: Deploy current branch to pantheon
    uses: irishdistillers/pantheon-deploy@master
    with:
      PR_STATE: 'open'
      PANTHEON_MACHINE_TOKEN: ${{ secrets.PANTHEON_MACHINE_TOKEN }}
      REMOTE_REPO_URL: 'url'
      REMOTE_REPO_NAME: 'name'
      STRICT_BRANCH_NAMES: 'strict'
```

```
  - name: Delete/merge corresponding multidev in pantheon
    uses: irishdistillers/pantheon-deploy@master
    with:
      PR_STATE: 'close'
      PANTHEON_MACHINE_TOKEN: ${{ secrets.PANTHEON_MACHINE_TOKEN }}
      REMOTE_REPO_NAME: 'name'
```

## Disclaimer

Use at your own risk.


## TODO

- Use `env` instead of `with` in workflow
- Send comments to PR directly from the action itself
- npm builds ?
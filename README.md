This GitHub Action syncs your current issue branch to a remote Pantheon repo, using NodeJS.

# Parameters

- `PANTHEON_REPO_URL` [required]

Remote GIT Repo URL (in pantheon)

- `PANTHEON_SITE_ID` [required]

Pantheon site id (or site.env in terminus)

- `PULL_REQUEST_STATE` [required]

State of the pull request that triggered the action

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
      PULL_REQUEST_STATE: 'open'
      PANTHEON_REPO_URL: 'url'
      PANTHEON_SITE_ID: 'name'
      STRICT_BRANCH_NAMES: 'strict'
```

```
  - name: Delete/merge corresponding multidev in pantheon
    uses: irishdistillers/pantheon-deploy@master
    with:
      PULL_REQUEST_STATE: 'close'
      PANTHEON_REPO_URL: 'url'
      PANTHEON_SITE_ID: 'name'
```
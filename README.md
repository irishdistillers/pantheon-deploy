This GitHub Action syncs your current issue branch to a remote Pantheon repo, using NodeJS.

# Parameters

- `PANTHEON_REPO_URL` [required]

Remote GIT Repo URL (in pantheon)

- `PANTHEON_SITE_ID` [required]

Pantheon site id (or site.env in terminus e.g: domain)

- `ACTION` [required]

Action to run: create-multidev | delete-multidev | merge-to-dev

- `BRANCH_NAME` [required]
  
The branch you want to send to Pantheon

- `STRICT_BRANCH_NAME` [optional]

Set to strict to enforce Jira ticket naming for branches (`none` by default)

# Dependencies

This Github actions required that you:

- Add an private SSH key in the SSH-agent and copy the public associated SSH key into Pantheon

- Use a Github action that install Terminus E.g: https://github.com/kopepasah/setup-pantheon-terminus

# Usage

```
  - name: Create current branch to pantheon
    uses: irishdistillers/pantheon-deploy@master
    with:
      ACTION: 'create-multidev'
      PANTHEON_REPO_URL: 'url'
      PANTHEON_SITE_ID: 'name'
      BRANCH_NAME: 'some-1'
      STRICT_BRANCH_NAMES: 'strict'
```

```
  - name: Delete/merge corresponding multidev in pantheon
    uses: irishdistillers/pantheon-deploy@master
    with:
      ACTION: 'delete-multidev'
      BRANCH_NAME: 'some-1'
      PANTHEON_REPO_URL: 'url'
      PANTHEON_SITE_ID: 'name'
```
This GitHub Action syncs your current issue branch to a remote Pantheon repo, using NodeJS.

# Parameters

| `VALUE`              |                                                                                   |
|----------------------|-----------------------------------------------------------------------------------|
| `ACTION`             | Remote GIT Repo URL (in pantheon)                                                 |
| `BRANCH_NAME`        | Name of the branch                                                                |
| `STRICT_BRANCH_NAME` | Boolean, `strict` if branch needs to adhere to JIRA formatting (eg: `ABC-12-foo`) |
| `PANTHEON_SITE_ID`   | UUID of the site (eg: `16c190c7-ee1f-4c27-80f9-cc403f8a64dd`)                     |
| `PANTHEON_SITE_NAME` | Site name as seen in `terminus site:list --fields=name` (eg: `secret-speyside`)   |
    
# Dependencies

This Github actions required that you:

- Add an private SSH key in the SSH-agent and copy the public associated SSH key into Pantheon
- Use a Github action that install Terminus E.g: https://github.com/kopepasah/setup-pantheon-terminus

# Usage

```
  - name: Create pantheon multidev
    uses: irishdistillers/pantheon-deploy@master
    with:
      ACTION: 'create-multidev'
      BRANCH_NAME: abc-12-foo
      PANTHEON_SITE_ID: 16c190c7-ee1f-4c27-80f9-cc403f8a64dd
      PANTHEON_SITE_NAME: secret-speyside
      STRICT_BRANCH_NAMES: 'strict'
```

```
  - name: Delete corresponding multidev in pantheon
    uses: irishdistillers/pantheon-deploy@master
    with:
      ACTION: 'delete-multidev'
      BRANCH_NAME: abc-12-foo
      PANTHEON_SITE_NAME: secret-speyside
```

```
  - name: Merge changes to pantheon dev
    uses: irishdistillers/pantheon-deploy@master
    with:
      ACTION: 'merge-to-dev'
      BRANCH_NAME: abc-12-foo
      PANTHEON_SITE_ID: 16c190c7-ee1f-4c27-80f9-cc403f8a64dd
```
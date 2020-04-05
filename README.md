
This GitHub Action deploys your current issue branch to a remote Pantheon repo, using NodeJS.

# Configuration

Pass configuration with `env` vars

- `PANTHEON_MACHINE_TOKEN` [required]

Pantheon Machine Token to be used in Terminus

- `REMOTE_REPO_URL` [required]

Remote GIT Repo URL

- `REMOTE_REPO_NAME` [required]

Remote GIT Repo Name

# Dependencies

This Github actions required that you:

- Add an private SSH key in the SSH-agent and copy the public associated SSH key into Pantheon

- Use a Github action that install Terminus E.g: https://github.com/kopepasah/setup-pantheon-terminus

# Usage

```
  - name: Deploy current branch to pantheon
    uses: irishdistillers/pantheon-deploy@master
    env:
      PANTHEON_MACHINE_TOKEN: ${{ secrets.PANTHEON_MACHINE_TOKEN }}
      REMOTE_REPO_URL: 'url'
      REMOTE_REPO_NAME: 'name'
```

## Disclaimer

Use at your own risk.

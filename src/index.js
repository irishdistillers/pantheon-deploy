#!/usr/bin/env node

const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const child_process = require('child_process');

const {
    REMOTE_REPO_URL,
    REMOTE_REPO_NAME,
    PANTHEON_MACHINE_TOKEN,
    GITHUB_WORKSPACE,
    HOME
} = process.env;
console.log('GITHUB_WORKSPACE', GITHUB_WORKSPACE);

const pantheonDeploy = (() => {

    const init = ({
        pantheonRepoURL,
        pantheonRepoName,
        machineToken,
        pullRequest
    }) => {
        gitBranch(pantheonRepoURL, pullRequest);
        buildMultiDev(machineToken, pantheonRepoName, pullRequest);
    };

    const gitBranch = (pantheonRepoURL, pullRequest) => {
        try {

            child_process.execSync("git config core.sshCommand 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'");
            child_process.execSync('git remote add pantheon ' + pantheonRepoURL);

            console.log("Git Remote added:");
            child_process.execSync('git remote -v');
            child_process.execSync('git fetch --unshallow origin');

            console.log("Pushing branch to Pantheon:");
            child_process.execSync('git push pantheon ' + pullRequest.head.ref + ':' + pullRequest.head.ref);

        } catch (error) {
            core.setFailed(error.message);
            process.abort();
        }
    };

    async function buildMultiDev(machineToken, pantheonRepoName, pullRequest) {
        try {

            await exec.exec('curl -O https://raw.githubusercontent.com/pantheon-systems/terminus-installer/master/builds/installer.phar');
            await exec.exec('sudo php installer.phar install'); // Sudo is required in order to install bin/terminus.
            await exec.exec('terminus', ['auth:login', `--machine-token=${ machineToken }`]);
            await exec.exec('terminus', ['multidev:create', pantheonRepoName, pullRequest.head.ref]);

            output = JSON.stringify(child_process.execSync(`terminus env:view --print ${ pantheonRepoName }.${ pullRequest.head.ref }`));
            core.setOutput('multidev-url', output);

        } catch (error) {
            core.setFailed(error.message);
            process.abort();
        }
    }

    return {
        init
    }
})();

const validateInputs = (inputs) => {
    const validInputs = inputs.filter(input => {
        if (!input) {
            console.error(`⚠️ ${input} is mandatory`);
        }

        return input;
    });

    if (validInputs.length !== inputs.length) {
        process.abort();
    }
};

const run = () => {
    pantheonDeploy.init({
        pantheonRepoURL: core.getInput('REMOTE_REPO_URL'),
        pantheonRepoName: core.getInput('REMOTE_REPO_NAME'),
        machineToken: core.getInput('PANTHEON_MACHINE_TOKEN'),
        pullRequest: github.context.payload.pull_request
    });
};

run();
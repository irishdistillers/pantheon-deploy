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
        prState,
        pantheonRepoURL,
        pantheonRepoName,
        machineToken,
        pullRequest,
        strictBranchName
    }) => {
        switch (prState) {
            case "open":
                open(
                    pantheonRepoURL,
                    pantheonRepoName,
                    machineToken,
                    pullRequest,
                    strictBranchName
                );
                break;
            case "close":
                close(
                    machineToken,
                    pantheonRepoName,
                    pullRequest
                );
                break;
        }
    };
    
    const open = ({
        pantheonRepoURL,
        pantheonRepoName,
        machineToken,
        pullRequest
    }) => {
        checkBranch(pullRequest.head.ref, strictBranchName);
        gitBranch(pantheonRepoURL, pullRequest);
        setupTerminus(machineToken);
        buildMultiDev(pantheonRepoName, pullRequest);
    };

    const close = ({
        pantheonRepoName,
        pullRequest,
        machineToken
    }) => {

        setupTerminus(machineToken);

        if (pullRequest.merged == true) {
            mergeMultiDev(pantheonRepoName, pullRequest);
        } else if (pullRequest.merged == false) {
            deleteMultiDev(pantheonRepoName, pullRequest);
        }
    };

    const checkBranch = (prName, strictBranchName) => {
        if (prName.length > 11) {
            core.setFailed("Branch name is too long to create a multidev. Branch names need to be 11 characters or less.");
            process.abort();
        } else if (strictBranchName == "strict" && !prName.match(/[A-z]*-[0-9]*-?[0-9]/)) {
            core.setFailed("Branch name needs to be Jira friendly (ABC-1234)");
            process.abort();
        } else {
            console.log("\n ✅ Branch name correct.");
        }
    };

    const gitBranch = (pantheonRepoURL, pullRequest) => {
        try {

            console.log("\n 👷 Github initial configuration:");
            child_process.execSync("git config core.sshCommand 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'");
            child_process.execSync('git remote add pantheon ' + pantheonRepoURL);

            console.log("\n Git Remote added:");
            child_process.execSync('git remote -v');
            child_process.execSync('git fetch --unshallow origin');

            console.log("\n Checkout current branch:");
            child_process.execSync('git checkout ' + pullRequest.head.ref);

            console.log("\n Pushing branch to Pantheon:");
            child_process.execSync('git push pantheon ' + pullRequest.head.ref + ':' + pullRequest.head.ref);
            console.log("\n ✅ Branch pushed to Pantheon.");

        } catch (error) {
            core.setFailed(error.message);
            process.abort();
        }
    };

    async function setupTerminus(machineToken) {
        try {

            await exec.exec('curl -O https://raw.githubusercontent.com/pantheon-systems/terminus-installer/master/builds/installer.phar');
            await exec.exec('sudo php installer.phar install'); // Sudo is required in order to install bin/terminus.
            await exec.exec('terminus', ['auth:login', `--machine-token=${ machineToken }`]);

        } catch (error) {
            core.setFailed(error.message);
            process.abort();
        }
    }

    async function mergeMultiDev(pantheonRepoName, pullRequest) {
        try {

            await exec.exec('terminus', ['multidev:merge-to-dev', pantheonRepoName, pullRequest.head.ref]);

        } catch (error) {
            core.setFailed(error.message);
            process.abort();
        }
    }

    async function deleteMultiDev(pantheonRepoName, pullRequest) {
        try {

            await exec.exec('terminus', ['multidev:delete', pantheonRepoName, pullRequest.head.ref]);

        } catch (error) {
            core.setFailed(error.message);
            process.abort();
        }
    }

    async function buildMultiDev(pantheonRepoName, pullRequest) {
        try {

            await exec.exec('terminus', ['multidev:create', pantheonRepoName, pullRequest.head.ref]);

            const output = JSON.stringify(child_process.execSync(`terminus env:view --print ${ pantheonRepoName }.${ pullRequest.head.ref }`));
            console.log('\n URL to access the multidev is : ' . output);
            core.setOutput('multidev-url', output);
            console.log("\n ✅ Multidev created.");

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
        pullRequestState: core.getInput('PR_STATE'),
        pantheonRepoURL: core.getInput('REMOTE_REPO_URL'),
        pantheonRepoName: core.getInput('REMOTE_REPO_NAME'),
        machineToken: core.getInput('PANTHEON_MACHINE_TOKEN'),
        pullRequest: github.context.payload.pull_request,
        strictBranchName: core.getInput('STRICT_BRANCH_NAMES') || "none",
    });
};

run();
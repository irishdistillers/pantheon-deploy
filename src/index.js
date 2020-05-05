#!/usr/bin/env node

const core = require('@actions/core');
const child_process = require('child_process');

const successItems = ["🦾", "✅", "👍", "😎", "🤓", "😊", "🎉", "🔥", "👷", "🏄"]
const errorItems = ["🙀", "⭕", "🥶", "😵", "💣", "🧨", " 🤷", "⛔", "❌", "🆘"]

const reservedBranchNames = ["settings", "master", "team", "support", "debug", "multidev", "files", "tags", "billing"]

const pantheon = (() => {

    const init = ({
        action,
        branchName,
        siteId,
        siteName,
        strictBranchName
    }) => {
        hasTerminus();

        switch (action) {
            case "create-multidev":
                isBranchNameValid(branchName, strictBranchName);
                branchPush(siteId, branchName);
                createMultiDev(siteName, branchName);
                break;
            case "merge-to-dev":
                branchPush(siteId, branchName);
                break;
            case "delete-multidev":
                deleteMultiDev(siteName, branchName);
                break;
            default:
                customLog('error', `️️️Unknown action: ${action}`);
                process.abort();
                break;
        }
    }

    const generateRepoUrl = (siteId) => {
        return `ssh://codeserver.dev.${ siteId }@codeserver.dev.${ siteId }.drush.in:2222/~/repository.git`;
    }

    const configureGit = (siteId) => {
        try {
            child_process.execSync("git config core.sshCommand 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'");
            child_process.execSync(`git remote add pantheon ${generateRepoUrl(siteId)}`);

            child_process.execSync('git remote -v');
            child_process.execSync('git fetch --unshallow origin');
        } catch (error) {
            customLog('error', error.message);
            process.abort();
        }
    }

    const branchPush = (siteId, branchName) => {
        try {
            configureGit(siteId);

            child_process.execSync(`git checkout ${branchName}`);
            child_process.execSync(`git push pantheon ${branchName}:${branchName}`);
        } catch (error) {
            customLog('error', error.message);
            process.abort();
        }
    }

    const isBranchNameValid = (branchName, strictBranchName) => {
        if (branchName.length > 11) {
            customLog('error', `Branch name ${branchName} is too long to create a multidev. Branch names need to be 11 characters or less. 🗣️`);
            process.abort();
        } else if ("strict" === strictBranchName && !branchName.match(/[A-Z]*[0-9]*?[0-9]/)) {
            customLog('error', `Branch name ${branchName} needs to be Jira friendly (abc-1234)`);
            process.abort();
        } else if (reservedBranchNames.includes(branchName)) {
            customLog('error', `Branch name "${branchName}" is a reserved name`);
            process.abort();
        }

        customLog('check-branch', `Branch name ${branchName} is correct`);
    }

    const customLog = (outputName, string) => {
        const output = JSON.stringify(string);

        if ('error' == outputName) {
            let randItem = errorItems[Math.floor(Math.random() * errorItems.length)]
            core.setFailed(randItem + " " + output);
            process.abort();
        }

        const randItem = successItems[Math.floor(Math.random() * successItems.length)]
        console.log(randItem + " " + outputName, output);
    }

    const hasTerminus = () => {
        try {
            child_process.execSync('terminus -V');
            customLog('setup-terminus', 'Terminus is set and ready to go');
        } catch (error) {
            customLog('error', 'Terminus is missing');
            process.abort();
        }
    }

    const sanitizeBranchName = (branchName) => {
        return branchName.toLowerCase();
    }

    const deleteMultiDev = (remoteName, branchName) => {
        try {
            branchName = branchName.toLowerCase();
            child_process.execSync(`terminus multidev:delete ${remoteName}.${sanitizeBranchName(branchName)} -y`);

            customLog('delete-multidev', `${branchName} has been deleted`);
            core.setOutput('multidev', `${branchName} has been deleted`);
        } catch (error) {
            customLog('error', error.message);
            process.abort();
        }
    }

    const createMultiDev = (remoteName, branchName) => {
        try {
            child_process.execSync(`terminus multidev:create ${remoteName} ${sanitizeBranchName(branchName)}`);

            let multidevUrl =
                child_process.execSync(`terminus env:view --print ${remoteName}.${sanitizeBranchName(branchName)}`);

            customLog('create-multidev', `${branchName} has been created`);
            core.setOutput('multidev', `${multidevUrl} has been created`);
        } catch (error) {
            customLog('error', error.message);
            process.abort();
        }
    }

    return {
        init
    }
})();

const run = () => {
    pantheon.init({
        action: core.getInput('ACTION', {'required': true}),
        branchName: core.getInput('BRANCH_NAME'),
        siteId: core.getInput('PANTHEON_SITE_ID'),
        siteName: core.getInput('PANTHEON_SITE_NAME'),
        strictBranchName: core.getInput('STRICT_BRANCH_NAME')
    });
};

run();
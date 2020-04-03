#!/usr/bin/env node
const fs = require('fs');
const core = require('@actions/core');
const exec = require( '@actions/exec' );
const github = require('@actions/github');
const child_process = require('child_process');

const { SSH_PRIVATE_KEY, SSH_AUTH_SOCK, REMOTE_REPO_URL, REMOTE_REPO_NAME, PANTHEON_MACHINE_TOKEN, GITHUB_WORKSPACE, HOME } = process.env;
console.log('GITHUB_WORKSPACE', GITHUB_WORKSPACE);

const pantheonDeploy = (() => {

    const init = ({ 
        privateKeyContent,
        sshSock,
        pantheonRepoURL,
        pantheonRepoName,
        machineToken,
        pullRequest
    }) => {
        sshAgentAdd(privateKeyContent, sshSock);
        gitBranch(pantheonRepoURL, pullRequest);
        buildMultiDev(machineToken, pantheonRepoName, pullRequest);
    };

    const sshAgentAdd = (privateKey, sshSock) => {
        try {

            const homeSsh = HOME + '/.ssh';
        
            if (!privateKey) {
                core.setFailed("The ssh-private-key argument is empty. Maybe the secret has not been configured, or you are using a wrong secret name in your workflow file.");
                return;
            }
        
            console.log(`Adding GitHub.com keys to ${homeSsh}/known_hosts`);
            fs.mkdirSync(homeSsh, { recursive: true });
            fs.appendFileSync(`${homeSsh}/known_hosts`, '\ngithub.com ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==\n');
            fs.appendFileSync(`${homeSsh}/known_hosts`, '\ngithub.com ssh-dss AAAAB3NzaC1kc3MAAACBANGFW2P9xlGU3zWrymJgI/lKo//ZW2WfVtmbsUZJ5uyKArtlQOT2+WRhcg4979aFxgKdcsqAYW3/LS1T2km3jYW/vr4Uzn+dXWODVk5VlUiZ1HFOHf6s6ITcZvjvdbp6ZbpM+DuJT7Bw+h5Fx8Qt8I16oCZYmAPJRtu46o9C2zk1AAAAFQC4gdFGcSbp5Gr0Wd5Ay/jtcldMewAAAIATTgn4sY4Nem/FQE+XJlyUQptPWMem5fwOcWtSXiTKaaN0lkk2p2snz+EJvAGXGq9dTSWHyLJSM2W6ZdQDqWJ1k+cL8CARAqL+UMwF84CR0m3hj+wtVGD/J4G5kW2DBAf4/bqzP4469lT+dF2FRQ2L9JKXrCWcnhMtJUvua8dvnwAAAIB6C4nQfAA7x8oLta6tT+oCk2WQcydNsyugE8vLrHlogoWEicla6cWPk7oXSspbzUcfkjN3Qa6e74PhRkc7JdSdAlFzU3m7LMkXo1MHgkqNX8glxWNVqBSc0YRdbFdTkL0C6gtpklilhvuHQCdbgB3LBAikcRkDp+FCVkUgPC/7Rw==\n');
        
            console.log("Starting ssh-agent");
            child_process.execFileSync('ssh-agent', ['-a', sshSock]);
            core.exportVariable('SSH_AUTH_SOCK', sshSock);
        
            console.log("Adding private key to agent");
            privateKey.split(/(?=-----BEGIN)/).forEach(function(key) {
                child_process.execSync('ssh-add -', { input: key.trim() + "\n" });
            });
        
            console.log("Keys added:");
            child_process.execSync('ssh-add -l', { stdio: 'inherit' });

        } catch (error) {
            core.setFailed(error.message);
            process.abort();
        }
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

    async function buildMultiDev (machineToken, pantheonRepoName, pullRequest) {
        try {
    
            await exec.exec( 'curl -O https://raw.githubusercontent.com/pantheon-systems/terminus-installer/master/builds/installer.phar' );
            await exec.exec( 'sudo php installer.phar install' ); // Sudo is required in order to install bin/terminus.
            await exec.exec( 'terminus', [ 'auth:login', `--machine-token=${ machineToken }` ] );
            await exec.exec( 'terminus', [ 'multidev:create', pantheonRepoName, pullRequest.head.ref ] );

            output = JSON.stringify(child_process.execSync(`terminus env:view --print ${ pantheonRepoName }.${ pullRequest.head.ref }`));
            core.setOutput('multidev-url', output);

        } catch ( error ) {
            core.setFailed( error.message );
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
        privateKeyContent: core.getInput('SSH_PRIVATE_KEY'),
        sshSock: core.getInput('SSH_AUTH_SOCK'),
        pantheonRepoURL: core.getInput('REMOTE_REPO_URL'),
        pantheonRepoName: core.getInput('REMOTE_REPO_NAME'),
        machineToken: core.getInput('PANTHEON_MACHINE_TOKEN'),
        pullRequest: github.context.payload.pull_request
    });
};

run();



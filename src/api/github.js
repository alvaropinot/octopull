const ghGot = require('gh-got')
const fs = require('fs')
const path = require('path')

module.exports = {
  init
}

function init (config) {
  const {
    owner,
    repo,
    branch,
    defaultBranch
  } = config

  return {
    createFileBlob,
    createRemoteBlob,
    commitFilesToBranch,
    createPr,
  }

  async function commitFilesToBranch (
    branchName,
    fileBlobs,
    message,
    parentBranch = config.defaultBranch) {
      console.log(`commitFilesToBranch('${branchName}', fileBlobs, ${message}, '${parentBranch})'`)
      const parentCommit = await getBranchCommit(parentBranch)
      const parentTree = await getCommitTree(parentCommit)

      // Create tree
      const tree = await createTree(parentTree, fileBlobs)
      const commit = await createCommit(parentCommit, tree, message)

      if ((await ghGot.get(`repos/${owner}/${repo}/commits/${commit}`)).body.files.length == 0) {
        throw 'empty commit';
      }

      return createBranch(branchName, commit)
    }

    async function createFileBlob (filePath) {
      // TODO: review this path.
      // TODO: change this to streams.
      const content = fs.readFileSync(path.join('.', filePath))
      console.log(`createFileBlob('${filePath}')'`)

      const blob = await createRemoteBlob(content)
      const stats = fs.statSync(path.join('.', filePath))

      return {
        name: filePath,
        mode: stats.mode.toString(8),
        blob,
      }
    }

  async function createPr (branchName, title, body) {
    const pr = (await ghGot.post(`repos/${owner}/${repo}/pulls`, {
      body: {
        title,
        head: branchName,
        base: config.defaultBranch,
        body
      },
    })).body;
    pr.displayNumber = `Pull Request #${pr.number}`;
    return pr;
  }

  async function createBranch (branchName, commit = config.baseCommitSHA) {
    await ghGot.post(`repos/${owner}/${repo}/git/refs`, {
      body: {
        ref: `refs/heads/${branchName}`,
        sha: commit,
      },
    })
  }

  async function getBranchCommit (branchName) {
    return (
      await ghGot(`repos/${owner}/${repo}/git/refs/heads/${branchName}`)
    ).body.object.sha
  }

  async function getCommitTree (commit) {
    console.log(`getCommitTree(${commit})`)
    return (
      await ghGot(`repos/${owner}/${repo}/git/commits/${commit}`)
    ).body.tree.sha
  }

  async function createRemoteBlob (fileContent) {
    console.log('Creating blob');
    const content = new Buffer(fileContent).toString('base64');
    console.log(content);
    return (await ghGot.post(`repos/${owner}/${repo}/git/blobs`, {
      body: {
        encoding: 'base64',
        content: content,
      },
    })).body.sha
  }

  async function createTree (baseTree, files) {
    console.log(`createTree(${baseTree}, files)`);
    const body = {
      base_tree: baseTree,
      tree: [],
    };
    files.forEach((file) => {
      body.tree.push({
        path: file.name,
        mode: file.mode,
        type: 'blob',
        sha: file.blob,
      });
    });
    console.log(body);
    return (await ghGot.post(`repos/${owner}/${repo}/git/trees`, { body })).body.sha;
  }

  async function createCommit (parent, tree, message) {
    console.log(`createCommit(${parent}, ${tree}, ${message})`);
    return (await ghGot.post(`repos/${owner}/${repo}/git/commits`, {
      body: {
        message,
        parents: [parent],
        tree,
      },
    })).body.sha;
  }
}

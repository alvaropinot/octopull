require('dotenv').config()

module.exports = {
  commit
}

async function commit (config, options) {
  const {defaultBranch, platform} = config
  const {branch, message, pullRequest} = options
  const {title, body, assignees, reviewers} = pullRequest
  const desiredApi = platform || 'github';

  const lib = require(`./api/${desiredApi}`)
  const api = lib.init(config)
  const files = options.files.map(api.createFileBlob)

  // Config applier.
  const commitFilesToBranch = files =>
    api.commitFilesToBranch(branch, files, message)

  // TODO: maybe change this to a single config object.
  const createPr = () => api.createPr(branch, title, body, assignees, reviewers)

  return Promise.all(files)
    .then(_log)
    .then(commitFilesToBranch)
    .then(_log)
    // TODO: return branch name from `commitFilesToBranch`
    .then(createPr)
    .catch(_log)
}

function _log (thing) {
  console.log(thing)
  return thing
}

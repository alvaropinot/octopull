const octopull = require('../lib')

const repos = [
  {
    owner: 'KarolAltamirano',
    repo: 'test',
    defaultBranch: 'master',
    platform: 'github'
  }
]

const options = {
  files: ['foo.yml', 'bar.yml'],
  branch: 'update-foo-and-bar',
  message: 'Cool commit msg',
  pullRequest: {
    title: 'Cool PR title',
    body: 'Cool PR body',
  }
}

repos.map(config => octopull.commit(config, options))

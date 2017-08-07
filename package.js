Package.describe({
  name: 'hexsprite:rollbar',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'rollbar error logger',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/hexsprite/meteor-rollbar',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: null
})

Package.onUse(function (api) {
  api.versionsFrom('1.5.1')
  api.use('ecmascript')
  api.use(['iron:router', 'meteorhacks:inject-initial'])
  api.mainModule('server.js', 'server')
  api.mainModule('client.js', 'client')
})

// Package.onTest(function (api) {
//   api.use('ecmascript')
//   // api.use('tinytest')
//   // api.mainModule('rollbar-tests.js')
// })

Npm.depends({
  rollbar: '2.1.3'
})

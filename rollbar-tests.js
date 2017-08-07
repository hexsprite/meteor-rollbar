// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest'

// Import and rename a variable exported by rollbar.js.
import { name as packageName } from 'meteor/focuster:rollbar'

// Write your tests here!
// Here is an example.
Tinytest.add('rollbar - example', function (test) {
  test.equal(packageName, 'rollbar')
})

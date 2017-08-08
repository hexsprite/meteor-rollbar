/* globals Assets */
import Rollbar from 'rollbar'
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { _ } from 'meteor/underscore'
import { Inject } from 'meteor/meteorhacks:inject-initial'
import { wrapMeteorDebug } from './common'

export let rollbar

Meteor.startup(() => {
  setupRollbar()
})

function setupRollbar () {
  const { accessToken } = Meteor.settings.rollbar
  const { environment } = Meteor.settings.public.rollbar
  rollbar = new Rollbar({
    accessToken,
    handleUncaughtExceptions: true,
    handleUnhandledRejections: true,
    ignoredMessages: [/.*You are using the appcache package.*/],
    payload: {
      environment
    }
  })
  injectRevision()
  addTestMethod()
  Meteor.startup(() => {
    wrapMeteorDebug(rollbar)
    wrapMethods()
  })
}

const wrapMethods = function () {
  var originalMeteorMethods = Meteor.methods
  // wrap future method handlers for capturing errors
  Meteor.methods = function (methodMap) {
    _.each(methodMap, function (handler, name) {
      wrapMethodHanderForErrors(name, handler, methodMap)
    })
    originalMeteorMethods(methodMap)
  }

  // wrap existing method handlers for capturing errors
  _.each(Meteor.default_server.method_handlers, function (handler, name) {
    wrapMethodHanderForErrors(
      name,
      handler,
      Meteor.default_server.method_handlers
    )
  })
}

// wrap Meteor methods to catch exceptions
function wrapMethodHanderForErrors (name, originalHandler, methodMap) {
  methodMap[name] = function () {
    try {
      return originalHandler.apply(this, arguments)
    } catch (ex) {
      rollbar.error(ex)
      throw ex
    }
  }
}

function addTestMethod () {
  // method for testing
  Meteor.methods({
    errorTest (serverOnly) {
      check(serverOnly, Boolean)
      if (!serverOnly || Meteor.isServer) {
        throw new Error('fakeError', 'testing errors')
      }
    }
  })
}

function injectRevision () {
  // inject the revision of the app into the meta tags
  Inject.obj('rollbar', {
    codeVersion: getCodeVersion()
  })
}

function getCodeVersion () {
  // Assets.getText('revision.txt').trim()
  return process.env['SOURCE_VERSION']
}

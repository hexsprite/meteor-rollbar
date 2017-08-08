import Rollbar from 'rollbar'
import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { Blaze } from 'meteor/blaze'
import { Tracker } from 'meteor/tracker'
import { Injected } from 'meteor/meteorhacks:inject-initial'
import { wrapMeteorDebug } from './common'

export let rollbar

Meteor.startup(function () {
  const { accessToken, environment } = Meteor.settings.public.rollbar
  rollbar = window.rollbar = new Rollbar({
    accessToken,
    captureUncaught: true,
    captureUnhandledRejections: true,
    ignoredMessages: [
      // eslint-disable-next-line
      'Blocked a frame with origin "https://next.focuster.com" from accessing a frame with origin "https://js.stripe.com". Protocols, domains, and ports must match.',
      'Exception in template helper:',
      'Script error.',
      'Connection timeout. No sockjs heartbeat received.'
    ],
    payload: {
      environment,
      client: {
        javascript: {
          code_version: getCodeVersion(),
          source_map_enabled: true
        }
      }
    }
  })
  wrapBlazeExceptions()
  wrapAccounts()
  wrapMeteorDebug(rollbar)
  addErrorTrigger()
})

let loginCallbacks = []
let loginAutorun
function onLoginUser (fn) {
  loginCallbacks.push(fn)
  if (!loginAutorun) {
    Tracker.autorun(autorun => {
      loginAutorun = autorun
      const user = Meteor.user()
      console.log(user)
      if (user && user.services && user.services.google) {
        autorun.stop()
        loginCallbacks.forEach(cb => cb())
      }
    })
  }
}

function wrapAccounts () {
  // properly attribute requests to the right person
  onLoginUser(function () {
    const id = Meteor.userId()
    const { email } = Meteor.user().services.google
    rollbar.configure({
      payload: {
        person: {
          email,
          id
        }
      }
    })
  })
  Accounts.onLogout(function () {
    rollbar.configure({
      payload: {
        person: {
          email: null,
          id: null
        }
      }
    })
  })
}

function wrapBlazeExceptions () {
  // Exception in ... type of errors
  // e.g. Exception in template helper:
  const originalBlazeReportException = Blaze._reportException
  Blaze._reportException = function (e, msg) {
    rollbar.error(msg, e)
    e._rollbarReported = true
    return originalBlazeReportException.apply(this, arguments)
  }
}

function addErrorTrigger () {
  // for testing: make it easy to trigger an error on any URL
  // NOTE: this will trigger before the loggedIn callback runs
  if (window.location.href.includes('?trigger-error')) {
    throw new Error('test error')
  }
}

function getCodeVersion () {
  return Injected.obj('rollbar').codeVersion
}

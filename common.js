import { Meteor } from 'meteor/meteor'

/*
TODO:
- server: log publications properly
- log userId with with meteor methods
- map the bunyan category to context
*/

export function wrapMeteorDebug (rollbar) {
  let originalMeteorDebug = Meteor._debug
  Meteor._debug = function (m, s) {
    // We need to asign variables like this. Otherwise,
    // we can't see proper error messages.
    // See: https://github.com/meteorhacks/kadira/issues/193
    var message = m
    var stack = s

    // We hate Meteor._debug (no single usage pattern)
    if (message instanceof Error) {
      reportError(rollbar, message)
    } else if (stack instanceof Error) {
      reportError(rollbar, stack)
    } else if (typeof message === 'string') {
      // no error was provided, so we'll create one to generate traceback
      let extra = new Error(message)
      if (stack) {
        let stackLines = stack.split('\n')
        message = `${message} ${stackLines[0]}`
        extra = new Error(message)
        if (stackLines.length > 1) {
          extra.stack = stack
        }
      }
      rollbar.error(message, extra)
    }
    return originalMeteorDebug.apply(this, arguments)
  }
}

// don't log messages that we handled elsewhere
function reportError (rollbar, error) {
  if (error && !error._rollbarReported) {
    rollbar.error(error)
  }
}

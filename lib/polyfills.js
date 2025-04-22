// Polyfill for Promise
if (typeof Promise === "undefined") {
  // Simple Promise polyfill
  window.Promise = function (executor) {
    var callbacks = []
    var state = "pending"
    var value

    function resolve(newValue) {
      if (state === "pending") {
        value = newValue
        state = "fulfilled"
        executeCallbacks()
      }
    }

    function reject(reason) {
      if (state === "pending") {
        value = reason
        state = "rejected"
        executeCallbacks()
      }
    }

    function executeCallbacks() {
      for (var i = 0; i < callbacks.length; i++) {
        executeCallback(callbacks[i])
      }
      callbacks = null
    }

    function executeCallback(callback) {
      setTimeout(() => {
        var cb = state === "fulfilled" ? callback.onFulfilled : callback.onRejected
        if (cb === null) {
          if (state === "fulfilled") {
            callback.promise.resolve(value)
          } else {
            callback.promise.reject(value)
          }
          return
        }
        try {
          var result = cb(value)
          callback.promise.resolve(result)
        } catch (e) {
          callback.promise.reject(e)
        }
      }, 0)
    }

    this.then = (onFulfilled, onRejected) => {
      var promise = new Promise(() => {})
      callbacks.push({
        onFulfilled: typeof onFulfilled === "function" ? onFulfilled : null,
        onRejected: typeof onRejected === "function" ? onRejected : null,
        promise: promise,
      })
      if (state !== "pending") {
        executeCallbacks()
      }
      return promise
    }

    this.catch = function (onRejected) {
      return this.then(null, onRejected)
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }
}

// Polyfill for fetch
if (typeof fetch === "undefined") {
  window.fetch = (url, options) =>
    new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest()
      xhr.open((options && options.method) || "GET", url)

      if (options && options.headers) {
        for (var header in options.headers) {
          xhr.setRequestHeader(header, options.headers[header])
        }
      }

      xhr.onload = () => {
        var response = {
          status: xhr.status,
          statusText: xhr.statusText,
          ok: xhr.status >= 200 && xhr.status < 300,
          json: () =>
            new Promise((resolve, reject) => {
              try {
                resolve(JSON.parse(xhr.responseText))
              } catch (e) {
                reject(e)
              }
            }),
          text: () => Promise.resolve(xhr.responseText),
        }
        resolve(response)
      }

      xhr.onerror = () => {
        reject(new Error("Network request failed"))
      }

      xhr.send(options && options.body)
    })
}

// Polyfill for Object.assign
if (typeof Object.assign !== "function") {
  Object.assign = (target) => {
    if (target == null) {
      throw new TypeError("Cannot convert undefined or null to object")
    }

    var to = Object(target)

    for (var i = 1; i < arguments.length; i++) {
      var nextSource = arguments[i]

      if (nextSource != null) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey]
          }
        }
      }
    }

    return to
  }
}

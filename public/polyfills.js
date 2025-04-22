// Very basic polyfills for old browsers

// Object.assign polyfill
if (typeof Object.assign !== "function") {
  Object.assign = (target) => {
    if (target == null) {
      throw new TypeError("Cannot convert undefined or null to object")
    }

    target = Object(target)
    for (var index = 1; index < arguments.length; index++) {
      var source = arguments[index]
      if (source != null) {
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key]
          }
        }
      }
    }
    return target
  }
}

// Array.from polyfill
if (!Array.from) {
  Array.from = (arrayLike) => Array.prototype.slice.call(arrayLike)
}

// Simple Promise polyfill (very basic)
if (typeof Promise === "undefined") {
  window.Promise = function (executor) {
    this.then = function () {
      return this
    }
    this.catch = function () {
      return this
    }

    try {
      executor(
        () => {},
        () => {},
      )
    } catch (e) {}
  }
}

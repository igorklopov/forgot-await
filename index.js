// DONT FORGET TO DELTE ".babel.json"

function assert(cond) {
  if (!cond) {
    console.error("Assertion");
    process.exit(4); // TODO
  }
}

// npm i callsites
function callsites(upstack) {
  const _ = Error.prepareStackTrace;
  Error.prepareStackTrace = (__, stack) => stack;
  const stack = new Error().stack.slice(upstack + 1);
  Error.prepareStackTrace = _;
  return stack;
}

const markPromiseMap = new Map();

class MarkPromise {
  constructor(ex, upstack = 0) {
    this._promise = new Promise(ex);
    assert(!markPromiseMap.has(this));
    markPromiseMap.set(this);
    this._callsites = callsites(upstack + 1);
  }
  then(...args) {
    return this._promise.then(...args);
  }
  catch(...args) {
    return this._promise.catch(...args);
  }
  _unmark() {
    assert(markPromiseMap.has(this));
    markPromiseMap.delete(this);
    return this;
  }
  static topmostAsync(afn) {
    return function() {
      const p = afn();
      assert(p.then);
      p._unmark();
      return p;
    }
  }
  static check() {
    if (markPromiseMap.size > 0) {
      console.error("Unhandled resolution of the following",
        markPromiseMap.size, "promise(s):");
      console.error("==================");
      for (const [ promise ] of markPromiseMap) {
        console.error(promise._callsites.join("\n"));
        console.error("==================");
      }
      process.exit(4);
    }
  }
  static resolve(...args) {
    return Promise.resolve(...args);
  }
}

(function() {
  const helpers = require("babel-helpers");
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  const _babelTemplate = require("babel-template");
  const _babelTemplate2 = _interopRequireDefault(_babelTemplate);
  const newAsyncToGenerator = (0, _babelTemplate2.default)(`
    (function (fn) {
      return function () {
        var gen = fn.apply(this, arguments);
        return new Promise.MarkPromise(function (resolve, reject) {
          function step(key, arg) {
            try {
              var info = gen[key](arg);
              var value = info.value;
            } catch (error) {
              reject(error);
              return;
            }
            if (value && value._unmark) {
              value._unmark();
            }
            if (info.done) {
              resolve(value);
            } else {
              return Promise.resolve(value).then(function (value) {
                return step("next", value);
              }, function (err) {
                return step("throw", err);
              });
            }
          }
          return step("next");
        });
      };
    })
  `);

  assert(helpers.get);
  const save = helpers.get;
  helpers.get = function(name) {
    if (name === "asyncToGenerator") {
      return newAsyncToGenerator().expression;
    } else {
      return save.call(this, name);
    }
  };

  if (helpers.default) {
    helpers.default = helpers.get;
  }
}());

Promise.MarkPromise = MarkPromise;
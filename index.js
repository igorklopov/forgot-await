// DONT FORGET TO DELTE ".babel.json"

function assert(cond) {
  if (!cond) {
    console.error("Assertion");
    process.exit(4); // TODO
  }
}

const markPromiseMap = new Map();

Promise.marker = {};

Promise.marker.callsites = function(upstack) {
  const _ = Error.prepareStackTrace;
  Error.prepareStackTrace = (__, stack) => stack;
  const stack = new Error().stack.slice(upstack);
  Error.prepareStackTrace = _;
  return stack;
};

function unmarkPromise() {
  assert(markPromiseMap.has(this));
  markPromiseMap.delete(this);
  return this;
}

Promise.marker.mark = function(p, stack_) {
  assert(!markPromiseMap.has(p));
  markPromiseMap.set(p);
  p._stack = stack_ || Promise.marker.callsites(2);
  p._unmark = unmarkPromise;
  return p;
};

Promise.marker.topmostAsync = function(afn) {
  return function() {
    const p = afn();
    assert(p.then);
    p._unmark();
    return p;
  };
};

Promise.marker.checkMarkList = function() {
  if (markPromiseMap.size > 0) {
    console.error("Unhandled resolution of the following",
      markPromiseMap.size, "promise(s):");
    console.error("==================");
    for (const [ promise ] of markPromiseMap) {
      console.error(promise._stack.join("\n"));
      console.error("==================");
    }
    process.exit(4);
  }
};

(function() {
  const helpers = require("babel-helpers");
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  const _babelTemplate = require("babel-template");
  const _babelTemplate2 = _interopRequireDefault(_babelTemplate);
  const newAsyncToGenerator = (0, _babelTemplate2.default)(`
    (function (fn) {
      var stack_ = Promise.marker.callsites(2);
      return function () {
        var gen = fn.apply(this, arguments);
        return Promise.marker.mark(new Promise(function (resolve, reject) {
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
        }), stack_);
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

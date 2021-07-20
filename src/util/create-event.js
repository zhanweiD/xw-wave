import random from './random'

const createEvent = (privateName = '') => {
  const id = `__event-${privateName}-${random()}`
  const rename = name => `${id}-${name}`
  let cache = {}

  const event = {
    on(name, fn, remark) {
      if (typeof name === 'string' && typeof fn === 'function') {
        const prefixedName = rename(name)
        cache[prefixedName] = cache[prefixedName] || []
        fn.remark = remark
        cache[prefixedName].push(fn)
      }
    },

    once(name, fn, remark) {
      if (typeof name === 'string' && typeof fn === 'function') {
        const prefixedName = rename(name)
        cache[prefixedName] = cache[prefixedName] || []
        fn.remark = remark
        fn.isOnceDone = false
        cache[prefixedName].push(fn)
      }
    },

    off(name, fn) {
      const prefixedName = rename(name)
      if (!fn) {
        delete cache[prefixedName]
      } else {
        const fns = cache[prefixedName] || []
        fns.splice(fns.indexOf(fn), 1)
        if (!fns.length) {
          delete cache[prefixedName]
        }
      }
    },

    fire(name, args, context) {
      const fns = cache[rename(name)]
      if (fns) {
        let fn
        for (let i = 0, l = fns.length; i < l; i++) {
          fn = fns[i]
          if (!fn.isOnceDone) {
            fn.apply(context || null, [].concat(args))
          } else if (fn.isOnceDone === false) {
            fn.apply(context || null, [].concat(args))
            fn.isOnceDone = true
          }
        }
      }
    },

    has(name) {
      return !!cache[rename(name)]
    },

    clear() {
      cache = {}
    },
  }

  return event
}

export default createEvent

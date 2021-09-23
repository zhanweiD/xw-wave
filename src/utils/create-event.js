import random from './random'

const createEvent = (privateName = '') => {
  const id = `__event-${privateName}-${random()}`
  const rename = name => `${id}-${name}`
  let cache = {}

  const event = {
    onWithOff(name, category, fn) {
      // swap
      if (typeof category === 'function') {
        [fn, category] = [category, fn]
      }
      this.off(name, fn, category)
      this.on(name, fn, category)
    },

    on(name, fn, category) {
      if (typeof name === 'string' && typeof fn === 'function') {
        const prefixedName = rename(name)
        cache[prefixedName] = cache[prefixedName] || []
        fn.category = category
        cache[prefixedName].push(fn)
      }
    },

    once(name, fn, category) {
      if (typeof name === 'string' && typeof fn === 'function') {
        const prefixedName = rename(name)
        cache[prefixedName] = cache[prefixedName] || []
        fn.category = category
        fn.isOnceDone = false
        cache[prefixedName].push(fn)
      }
    },

    off(name, fn, category) {
      const prefixedName = rename(name)
      // swap
      if (typeof fn === 'string') {
        [fn, category] = [category, fn]
      }
      if (!fn && !category) {
        delete cache[prefixedName]
      } else if (category) {
        const fns = cache[prefixedName] || []
        const targets = fns.filter(item => item.category === category)
        for (let i = 0; i < targets.length; i++) {
          fns.splice(fns.indexOf(targets[i]), 1)
        }
        if (!fns.length) {
          delete cache[prefixedName]
        }
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

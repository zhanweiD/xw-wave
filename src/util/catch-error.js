/**
 * catch every error that may be thrown in the life cycle
 * @param {any} object 
 * @param {function} onError run when error
 */
const catchError = (object, onError) => {
  // basic life cycles
  let lifeCycles = ['setData', 'setStyle', 'draw']
  // other function that need to be catched
  // eslint-disable-next-line no-restricted-syntax
  for (const key in object) {
    if (typeof object[key] === 'function') {
      lifeCycles.push(key)
    }
  }
  lifeCycles = Array.from(new Set(lifeCycles))
  // start catch error
  lifeCycles.forEach(name => {
    const fn = object[name]
    object[name] = (...parameter) => {
      try {
        fn.call(object, ...parameter)
        object.event.fire(name, {...parameter})
      } catch (error) {
        onError(error)
      }
    }
  })
}

export default catchError

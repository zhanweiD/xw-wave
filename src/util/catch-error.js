/* eslint-disable no-restricted-syntax */
export default (object, onError) => {
  // 基础图层生命周期
  let lifeCycles = ['setData', 'setStyle', 'draw']
  // 其他自定义函数
  for (const key in object) {
    if (typeof object[key] === 'function') {
      lifeCycles.push(key)
    }
  }
  // 生命周期
  lifeCycles = Array.from(new Set(lifeCycles))
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

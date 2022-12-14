import {merge} from 'lodash'
import createEvent from '../utils/create-event'
import createLog from '../utils/create-log'
import uuid from '../utils/uuid'

export default class AnimationBase {
  constructor(defaultOptions, incomingOptions, context) {
    this.isAnimationStart = false
    // toggle false after destroyed
    this.isAnimationAvailable = true
    this.instance = null
    // initialize options
    this.id = uuid()
    this.log = createLog('src/animation/base')
    this.event = createEvent('src/animation/base')
    this.options = merge({context}, defaultOptions, incomingOptions)
    this.createTargets('targets', context)
    this.#createLifeCycles()
  }

  // transform targets
  createTargets(key, context) {
    const targets = this.options[key]
    if (targets && typeof targets === 'string') {
      merge(this.options, {className: targets, [key]: context.selectAll(targets).nodes()})
    } else if (targets && targets.constructor.name === 'Selection') {
      merge(this.options, {[key]: targets.nodes()})
    }
  }

  #createLifeCycles = () => {
    // basic life cycles
    const lifeCycles = ['init', 'play', 'start', 'process', 'end', 'destroy']
    // start catch error
    lifeCycles.forEach(name => {
      const instance = this
      const fn = instance[name] || (() => null)
      instance[name] = (...parameter) => {
        try {
          if (name === 'init') {
            this.isAnimationAvailable = true
          } else if (name === 'play') {
            if (!instance.isAnimationAvailable) {
              instance.log.warn('The animation is not available!')
              return
            }
            if (instance.isAnimationStart) {
              instance.log.warn('The animation is already started!')
              return
            }
          } else if (name === 'start') {
            instance.isAnimationStart = true
          } else if (name === 'end') {
            instance.isAnimationStart = false
          } else if (name === 'destroy') {
            this.isAnimationAvailable = false
          }
          fn.call(instance, ...parameter)
          instance.event.fire(name, {...parameter})
        } catch (error) {
          instance.log.error('Animation life cycle call exception', error)
        }
      }
    })
  }
}

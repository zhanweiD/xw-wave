import {merge} from 'lodash'
import createEvent from '../util/create-event'
import createLog from '../util/create-log'
import uuid from '../util/uuid'

// 动画基类
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
  }

  // transform targets
  createTargets(key, context) {
    const targets = this.options[key]
    if (targets && typeof targets === 'string') { // class
      merge(this.options, {className: targets, [key]: context.selectAll(targets).nodes()})
    } else if (targets && targets.constructor.name === 'Selection') {
      merge(this.options, {[key]: targets.nodes()})
    }
  }

  play() {
    this.event.fire('play')
    this.start()
    this.process()
    this.end()
  }

  start() {
    this.isAnimationStart = true
    this.event.fire('start')
  }

  process(data) {
    this.event.fire('process', data)
  }

  end() {
    this.isAnimationStart = false
    this.event.fire('end')
  }

  destroy() {
    this.isAnimationAvailable = false
    this.event.fire('destroy')
  }
}

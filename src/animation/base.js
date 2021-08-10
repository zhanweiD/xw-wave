import {merge} from 'lodash'
import createEvent from '../util/create-event'
import createLog from '../util/create-log'
import uuid from '../util/uuid'

// 动画基类
export default class AnimationBase {
  constructor(defaultOptions, incomingOptions, context) {
    // 动画是否正在执行
    this.isAnimationStart = false
    // 动画是否可用，destroy 之后设为 false
    this.isAnimationAvailable = true
    // 动画实例对象，暴露出去用于动画控制
    this.instance = null
    // 初始化 options
    const options = merge({context}, defaultOptions, incomingOptions)
    const {targets} = options
    if (targets && typeof targets === 'string') { // class
      merge(options, {className: targets, targets: context.selectAll(targets)._groups[0]})
    } else if (targets && targets.constructor.name === 'Selection') {
      merge(options, {targets: targets._groups[0]})
    }
    this.id = uuid()
    this.options = options
    this.log = createLog('src/animation/base')
    this.event = createEvent('src/animation/base')
  }

  // 生命周期钩子：控制动画执行
  play() {
    this.event.has('play') && this.event.fire('play')
    this.start()
    this.process()
    this.end()
  }

  // 生命周期：动画开始
  start() {
    this.isAnimationStart = true
    this.event.has('start') && this.event.fire('start')
  }

  // 生命周期：动画进行中
  process(data) {
    this.event.has('process') && this.event.fire('process', data?.progress)
  }

  // 生命周期：动画结束
  end() {
    this.isAnimationStart = false
    this.event.has('end') && this.event.fire('end')
  }

  // 生命周期钩子：控制动画销毁
  destroy() {
    this.isAnimationAvailable = false
    this.event.has('destroy') && this.event.fire('destroy')
  }
}

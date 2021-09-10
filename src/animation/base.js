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
    this.id = uuid()
    this.log = createLog('src/animation/base')
    this.event = createEvent('src/animation/base')
    this.options = merge({context}, defaultOptions, incomingOptions)
    this.createTargets('targets', context)
  }

  // 将不同类型的目标转换为 DOM 节点
  createTargets(key, context) {
    const targets = this.options[key]
    if (targets && typeof targets === 'string') { // class
      merge(this.options, {className: targets, [key]: context.selectAll(targets).nodes()})
    } else if (targets && targets.constructor.name === 'Selection') {
      merge(this.options, {[key]: targets.nodes()})
    }
  }

  // 生命周期钩子：控制动画执行
  play() {
    this.event.fire('play')
    this.start()
    this.process()
    this.end()
  }

  // 生命周期钩子：动画开始
  start() {
    this.isAnimationStart = true
    this.event.fire('start')
  }

  // 生命周期钩子：动画进行中
  process(data) {
    this.event.fire('process', data)
  }

  // 生命周期钩子：动画结束
  end() {
    this.isAnimationStart = false
    this.event.fire('end')
  }

  // 生命周期钩子：控制动画销毁
  destroy() {
    this.isAnimationAvailable = false
    this.event.fire('destroy')
  }
}

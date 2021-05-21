import {merge} from 'lodash'
import createEvent from '../util/create-event'
import createLog from '../util/create-log'

// 动画基类
export default class AnimationBase {
  constructor(defaultOptions, incomingOptions, context) {
    // 事件
    this.event = createEvent(__filename)
    // 日志
    this.log = createLog(__filename)
    // 动画是否正在执行
    this.isAnimationStart = false
    // 动画是否可用，destroy 之后设为 false
    this.isAnimationAvailable = true
    // 动画实例对象，暴露出去用于动画控制
    this.instance = null
    // 初始化 options
    const options = merge({context}, defaultOptions, incomingOptions)
    const {targets} = options
    if (targets && typeof targets === 'string') {
      // class 作为 targets
      merge(options, {className: targets, targets: context.selectAll(targets)._groups[0]})
    } else if (targets && targets.constructor.name === 'Selection') {
      // d3 Selection 作为 targets
      merge(options, {targets: targets._groups[0]})
    }
    this.options = options
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

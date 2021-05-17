import {merge} from 'lodash'
import createEvent from '../util/create-event'
import createLog from '../util/create-log'

// 动画基类
export default class AnimationBase {
  constructor(defaultOptions, options, context) {
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
    this.#createOptions(defaultOptions, options, context)
  }

  // 统一的样式处理判断，确保 targets 是 dom 元素
  #createOptions = (defaultOptions, incomingOptions, context) => {
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
}

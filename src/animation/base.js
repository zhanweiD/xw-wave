import createEvent from '../../../common/event'
import createLog from '../../../common/create-log'

// 动画抽象类
export default class AnimationBase {
  constructor() {
    // 事件
    this.event = createEvent()
    // 日志
    this.log = createLog(__filename)
    // 动画是否正在执行
    this.isAnimationStart = false
    // 动画是否可用，destroy 之后设为 false
    this.isAnimationAvailable = true
    // anime 实例对象，暴露出去用于动画控制
    this.instance = null
  }
}

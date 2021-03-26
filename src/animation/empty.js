import anime from 'animejs'
import AnimationBase from './base'

// 类型常量
const types = {
  FUNCTION: 'funtion',
  TIMER: 'timer',
}
// 默认参数
const defaultOptions = {
  duration: 0,
  type: types.FUNCTION,
  loop: false,
}

// 空动画对象，用于执行中间函数或其他功能
export default class EmptyAnimation extends AnimationBase {
  constructor(options = {}) {
    super(options)
    this.options = {...defaultOptions, ...options}
    this.isAnimationStart = false
    this.isAnimationAvailable = true
  }

  play() {
    const {duration, loop, type} = this.options
    if (type === types.FUNCTION) {
      this.start.call(this)
      this.process.call(this)
      this.end.call(this)
    } else if (types.TIMER) {
      this.instance = anime({
        duration,
        loop,
        update: this.process.bind(this),
        loopBegin: this.start.bind(this),
        loopComplete: this.end.bind(this),
      })
    }
  }

  start() {
    this.isAnimationStart = true
    this.event.has('start') && this.event.fire('start')
  }

  process() {
    this.event.has('process') && this.event.fire('process')
  }

  end() {
    this.isAnimationStart = false
    this.event.has('end') && this.event.fire('end')
  }

  destory() {
    this.isAnimationAvailable = false
    this.options.type === types.TIMER && this.instance.remove()
  }
}

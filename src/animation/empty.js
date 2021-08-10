import anime from 'animejs'
import AnimationBase from './base'

// 类型常量
const modeType = {
  FUNCTION: 'funtion',
  TIMER: 'timer',
}

// 默认参数
const defaultOptions = {
  duration: 0,
  mode: modeType.FUNCTION,
  loop: false,
}

// 空动画对象，用于执行中间函数或其他功能
export default class EmptyAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
  }

  play() {
    const {duration, loop, mode} = this.options
    if (mode === modeType.FUNCTION) {
      this.start.call(this)
      this.process.call(this)
      this.end.call(this)
    } else if (mode === modeType.TIMER) {
      this.instance = anime({
        duration,
        loop,
        update: this.process.bind(this),
        loopBegin: this.start.bind(this),
        loopComplete: this.end.bind(this),
      })
    }
    this.event.has('play') && this.event.fire('play')
  }

  destroy() {
    this.isAnimationAvailable = false
    this.options.mode === modeType.TIMER && this.instance.remove()
    this.event.has('destroy') && this.event.fire('destroy')
  }
}

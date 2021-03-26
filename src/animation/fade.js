import anime from 'animejs'
import AnimationBase from './base'

// 类型常量
const types = {
  SHOW: 'fadeIn',
  HIDE: 'fadeOut',
}
// 默认参数
const defaultOptions = {
  delay: 0,
  duration: 2000,
  type: types.SHOW,
  loop: false,
}

export default class FadeAnimation extends AnimationBase {
  constructor(options, context) {
    super(options)
    this.options = {...defaultOptions, ...options, targets: context.root.selectAll(options.targets)._groups[0]}
    this.isAnimationStart = false
    this.isAnimationAvailable = true
  }

  play() {
    const {targets, delay, duration, loop, type} = this.options
    anime({
      targets,
      duration,
      delay,
      loop,
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      opacity: type === types.SHOW ? [0, 1] : [1, 0],
      easing: 'linear',
    })
  }

  start() {
    this.isAnimationStart = true
    this.event.has('start') && this.event.fire('start')
  }

  process(data) {
    this.event.has('process') && this.event.fire('process', data.progress)
  }

  end() {
    this.isAnimationStart = false
    this.event.has('end') && this.event.fire('end')
  }

  destory() {
    anime.remove(this.options.targets)
    this.isAnimationAvailable = false
  }
}

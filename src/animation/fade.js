import anime from 'animejs'
import AnimationBase from './base'

// 类型常量
const modeType = {
  SHOW: 'fadeIn',
  HIDE: 'fadeOut',
}

// 默认参数
const defaultOptions = {
  delay: 0,
  duration: 2000,
  mode: modeType.SHOW,
  loop: false,
}

export default class FadeAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
  }

  play() {
    const {targets, delay, duration, loop, mode} = this.options
    this.instance = anime({
      targets,
      duration,
      delay,
      loop,
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      opacity: mode === modeType.SHOW ? [0, 1] : [1, 0],
      easing: 'linear',
    })
    this.event.has('play') && this.event.fire('play')
  }

  destroy() {
    anime.remove(this.options.targets)
    this.isAnimationAvailable = false
    this.event.has('destroy') && this.event.fire('destroy')
  }
}

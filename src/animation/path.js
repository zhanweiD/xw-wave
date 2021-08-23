import anime from 'animejs'
import AnimationBase from './base'

// 默认参数
const defaultOptions = {
  delay: 0,
  duration: 2000,
  loop: false,
}

export default class PathAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    // 额外转换 path 对象
    this.createTargets('path', context)
  }

  play() {
    const {targets, path, delay, duration, loop} = this.options
    const animePath = anime.path(path)
    this.instance = anime({
      targets,
      duration,
      delay,
      loop,
      rotate: animePath('angle'),
      translateX: animePath('x'),
      translateY: animePath('y'),
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      easing: 'linear',
    })
    this.event.fire('play')
  }

  destroy() {
    anime.remove(this.options.targets)
    this.isAnimationAvailable = false
    this.event.fire('destroy')
  }
}

import anime from 'animejs'
import AnimationBase from './base'

const defaultOptions = {
  delay: 0,
  duration: 2000,
  loop: false,
}

export default class PathAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    // extra targets
    this.createTargets('path', context)
  }

  play() {
    const {targets, path, delay, duration, loop} = this.options
    const animePath = anime.path(path[0])
    this.instance = anime({
      targets,
      duration,
      delay,
      loop,
      // translate must before at rotate
      translateX: animePath('x'),
      translateY: animePath('y'),
      rotate: animePath('angle'),
      update: this.process,
      loopBegin: this.start,
      loopComplete: this.end,
      easing: 'linear',
    })
  }

  destroy() {
    this.instance?.seek(0)
    anime.remove(this.options.targets)
  }
}

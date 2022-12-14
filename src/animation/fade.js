import anime from 'animejs'
import AnimationBase from './base'

const modeType = {
  SHOW: 'fadeIn',
  HIDE: 'fadeOut',
}

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
      update: this.process,
      loopBegin: this.start,
      loopComplete: this.end,
      opacity: mode === modeType.SHOW ? [0, 1] : [1, 0],
      easing: 'linear',
    })
  }

  destroy() {
    const {delay, duration} = this.options
    this.instance?.seek(delay + duration)
    anime.remove(this.options.targets)
  }
}

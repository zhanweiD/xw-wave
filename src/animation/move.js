import anime from 'animejs'
import AnimationBase from './base'

const modeType = {
  ABSOLUTE: 'absolute',
  RELATIVE: 'relative',
}

const defaultOptions = {
  mode: modeType.RELATIVE,
  delay: 0,
  duration: 1000,
  offsetX: 0,
  offsetY: 0,
  loop: false,
  easing: 'linear',
}

export default class MoveAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
  }

  play() {
    const {targets, delay, duration, loop, mode, offsetX, offsetY, easing} = this.options
    this.instance = anime({
      targets,
      duration,
      delay,
      loop,
      easing,
      update: this.process,
      loopBegin: this.start,
      loopComplete: this.end,
      translateX: mode === modeType.ABSOLUTE ? offsetX : `+=${offsetX}`,
      translateY: mode === modeType.ABSOLUTE ? offsetY : `+=${offsetY}`,
    })
  }

  destroy() {
    const {delay, duration} = this.options
    this.instance?.seek(delay + duration)
    anime.remove(this.options.targets)
  }
}

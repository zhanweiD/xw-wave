import anime from 'animejs'
import AnimationBase from './base'

const modeType = {
  FUNCTION: 'funtion',
  TIMER: 'timer',
}

const defaultOptions = {
  duration: 0,
  mode: modeType.FUNCTION,
  loop: false,
}

// empty animation is useful for event
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
        update: this.process,
        loopBegin: this.start,
        loopComplete: this.end,
      })
    }
  }

  destroy() {
    if (this.options.mode === modeType.TIMER) {
      this.instance.remove()
    }
  }
}

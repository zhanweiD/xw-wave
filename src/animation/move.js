import anime from 'animejs'
import AnimationBase from './base'

const defaultOptions = {
  delay: 0,
  duration: 1000,
  position: [0, 0],
  loop: false,
  easing: 'linear',
}

// TODO: fix loop
export default class MoveAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
  }

  play() {
    const {targets, delay, duration, loop, position, easing} = this.options
    const [positionX, positionY] = position
    this.instance = anime({
      targets,
      duration,
      delay,
      loop,
      easing,
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      translateX: positionX,
      translateY: positionY,
    })
  }

  destroy() {
    anime.remove(this.options.targets)
  }
}

import anime from 'animejs'
import AnimationBase from './base'

// 默认参数
const defaultOptions = {
  delay: 0,
  duration: 1000,
  position: [0, 0],
  loop: false,
  easing: 'linear',
}

export default class MoveAnimation extends AnimationBase {
  constructor(options) {
    super(options)
    this.options = {...defaultOptions, ...options}
    this.isAnimationStart = false
    this.isAnimationAvailable = true
  }

  play() {
    const {targets, delay, duration, loop, position, easing} = this.options
    const [positionX, positionY] = position
    anime({
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

  destroy() {
    anime.remove(this.options.targets)
    this.isAnimationAvailable = false
  }
}

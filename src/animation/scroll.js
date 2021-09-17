import * as d3 from 'd3'
import anime from 'animejs'
import AnimationBase from './base'

const defaultOptions = {
  delay: 2000,
  duration: 2000,
  offset: [0, 0],
  reverse: false,
  clone: false,
  loop: true,
}

// TODO: append init
export default class ScrollAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    const {clone, offset, reverse, targets} = this.options
    // copy the same element to make the scroll animation continuous
    if (clone) {
      // the copied element is also the moving object of the animation
      const extraNodes = d3.selectAll(targets).clone(false).nodes()
      this.options.targets = Array.from(targets).concat(Array.from(extraNodes))
      // uniformly append the copied elements to the end of the original list
      anime({
        targets: extraNodes,
        translateX: `+=${extraNodes.length * offset[0]}`,
        translateY: `+=${extraNodes.length * offset[1]}`,
        duration: 0,
      })
      // move the element to makes the scroll animation continuous
      reverse && anime({
        targets: this.options.targets,
        translateX: `-=${offset[0]}`,
        translateY: `-=${offset[1]}`,
        duration: 0,
      })
    }
    this.elementNumber = this.options.targets.length
    this.active = reverse ? this.elementNumber - 1 : 0
  }

  play() {
    const {targets, delay, duration, offset, reverse} = this.options
    this.instance = anime({
      targets,
      duration,
      delay,
      keyframes: [{
        translateX: `${reverse ? '+=' : '-='}${offset[0]}`,
        translateY: `${reverse ? '+=' : '-='}${offset[1]}`,
        opacity: (el, i) => (this.active === i ? 0 : 1),
        duration,
      }, {
        translateX: (el, i, len) => (this.active === i ? `${reverse ? '-=' : '+='}${offset[0] * len}` : '+=0'),
        translateY: (el, i, len) => (this.active === i ? `${reverse ? '-=' : '+='}${offset[1] * len}` : '+=0'),
        opacity: 1,
        duration: 0,
      }],
      update: this.process,
      loopBegin: this.start,
      loopComplete: this.end,
      easing: 'linear',
    })
  }

  end() {
    this.active = !this.options.reverse
      ? (this.active + 1) % this.elementNumber
      : (this.active + this.elementNumber - 1) % this.elementNumber
    this.isAnimationAvailable && this.options.loop && this.play()
  }

  destroy() {
    anime.remove(this.options.targets)
  }
}

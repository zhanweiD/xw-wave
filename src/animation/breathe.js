import anime from 'animejs'
import * as d3 from 'd3'
import AnimationBase from './base'

// 默认参数
const defaultOptions = {
  delay: 0,
  duration: 2000,
  loop: false,
}

// 光晕滤镜
const createFilter = (parentNode, {id}) => {
  const filter = parentNode.append('filter')
    .attr('id', `url(#breathe-${id})`)
    .attr('x', '-500%')
    .attr('y', '-500%')
    .attr('width', '1000%')
    .attr('height', '1000%')
  filter.append('feOffset')
    .attr('result', 'offOut')
    .attr('in', 'SourceGraphic')
    .attr('dx', 0)
    .attr('dy', 0)
  const targets = filter.append('feGaussianBlur')
    .attr('result', 'blurOut')
    .attr('in', 'offOut')
    .attr('stdDeviation', 0)
  filter.append('feBlend')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'blurOut')
    .attr('mode', 'lighten')
  return targets
}

export default class BreatheAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    this.extraNode = context.append('defs')
    this.targets = createFilter(this.extraNode, {id: this.id})
    // 给元素添加光晕滤镜
    d3.selectAll(this.options.targets).attr('filter', `url(#breathe-${this.id})`)
  }

  play() {
    const {targets, delay, duration, loop} = this.options
    this.instance = anime({
      targets: [this.targets._groups[0], targets],
      duration,
      delay,
      loop,
      opacity: [1, 0, 1],
      stdDeviation: [0, 10, 0],
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      easing: 'linear',
    })
    this.event.has('play') && this.event.fire('play')
  }

  destroy() {
    this.extraNode.remove()
    this.isAnimationAvailable = false
    this.event.has('destroy') && this.event.fire('destroy')
    anime.remove([this.targets._groups[0], this.options.targets])
  }
}

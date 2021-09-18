import anime from 'animejs'
import * as d3 from 'd3'
import AnimationBase from './base'

const defaultOptions = {
  delay: 0,
  duration: 2000,
  loop: false,
}

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
  #extraNode = null

  #targets = null

  constructor(options, context) {
    super(defaultOptions, options, context)
    // append the filter to element
    d3.selectAll(this.options.targets).attr('filter', `url(#breathe-${this.id})`)
    this.init()
  }

  init() {
    const {context} = this.options
    this.#extraNode = context.append('defs')
    this.#targets = createFilter(this.#extraNode, {id: this.id})
  }

  play() {
    const {targets, delay, duration, loop} = this.options
    this.instance = anime({
      targets: [this.#targets.nodes(), targets],
      duration,
      delay,
      loop,
      opacity: [1, 0, 1],
      stdDeviation: [0, 10, 0],
      update: this.process,
      loopBegin: this.start,
      loopComplete: this.end,
      easing: 'linear',
    })
  }

  destroy() {
    this.instance?.seek(0)
    anime.remove([this.#targets.nodes(), this.options.targets])
    this.#extraNode.remove()
  }
}

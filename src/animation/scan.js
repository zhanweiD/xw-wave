import anime from 'animejs'
import chroma from 'chroma-js'
import AnimationBase from './base'

const directions = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  OUTER: 'outer',
  INNER: 'inner',
}

// choose which scope to scan
const scopes = {
  FILL: 'fill',
  STROKE: 'stroke',
  BOTH: 'both',
}

const defaultOptions = {
  delay: 1000, 
  duration: 3000, 
  direction: directions.BOTTOM,
  scope: scopes.FILL,
  color: 'rgb(255,255,255)',
  opacity: 0.4,
  loop: true,
}

// target attributes of svg
const getAttributes = direction => {
  let attributes
  if (direction === directions.LEFT || direction === directions.RIGHT) {
    attributes = ['x1', 'x2']
  } else if (direction === directions.TOP || direction === directions.BOTTOM) {
    attributes = ['y1', 'y2']
  } else if (direction === directions.OUTER || direction === directions.INNER) {
    attributes = ['r']
  }
  return attributes
}

// gradient offset
const insertOffsets = (gradient, {color, opacity}) => {
  const minColor = chroma(color).alpha(0)
  const maxColor = chroma(color).alpha(opacity)
  gradient.append('stop')
    .attr('offset', '20%')
    .style('stop-color', minColor)
  gradient.append('stop')
    .attr('offset', '45%')
    .style('stop-color', maxColor)
  gradient.append('stop')
    .attr('offset', '55%')
    .style('stop-color', maxColor)
  gradient.append('stop')
    .attr('offset', '80%')
    .style('stop-color', minColor)
  return gradient
}

const createGradient = (parentNode, {id, direction, color, opacity}) => {
  let targets
  const attributes = getAttributes(direction)
  const isLeftOrTop = direction === directions.LEFT || direction === directions.TOP
  parentNode.append('filter')
    .attr('id', `scan-filter-${id}`)
    .append('feGaussianBlur')
    .attr('in', 'SourceGraphic')
    .attr('stdDeviation', 0)
  if (attributes[0] === 'r') {
    targets = parentNode.append('radialGradient')
      .attr('id', `scan-${id}`)
      .attr(attributes[0], direction === directions.INNER ? '300%' : '0%')
  } else if (attributes.length === 2) {
    targets = parentNode.append('linearGradient')
      .attr('id', `scan-${id}`)
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '0%')
      .attr(attributes[0], isLeftOrTop ? '100%' : '-100%')
      .attr(attributes[1], isLeftOrTop ? '200%' : '0%')
  }
  return insertOffsets(targets, {color, opacity}).nodes()
}

export default class ScanAnimation extends AnimationBase {
  #extraNode = null

  #targets = null

  #lights = null

  constructor(options, context) {
    super(defaultOptions, options, context)
    this.init()
  }

  init() {
    const {direction, context, color, opacity} = this.options
    this.#extraNode = context.append('defs')
    this.#targets = createGradient(this.#extraNode, {id: this.id, direction, color, opacity})
  }

  play() {
    const {delay, duration, direction, loop, className, scope, context} = this.options
    const isLeftOrTop = direction === directions.LEFT || direction === directions.TOP
    const attributes = getAttributes(direction)
    const configs = {
      targets: this.#targets,
      duration,
      delay,
      loop,
      update: this.process,
      loopBegin: this.start,
      loopComplete: this.end,
      easing: 'linear',
    }
    // scan object
    if (!this.#lights) {
      this.#lights = context.selectAll(className).clone(false)
        .attr('class', 'scanAnimation-clone')
        .attr('filter', `url(#scan-filter-${this.id}`)
        .attr('stroke', scope !== scopes.FILL ? `url(#scan-${this.id})` : '')
        .style('fill', scope !== scopes.STROKE ? `url(#scan-${this.id})` : '')
        .style('pointer-events', 'none')
    }
    // changed attributes of svg
    if (attributes.length === 2) {
      configs[attributes[0]] = isLeftOrTop ? ['100%', '-100%'] : ['-100%', '100%']
      configs[attributes[1]] = isLeftOrTop ? ['200%', '0%'] : ['0%', '200%']
    } else if (attributes[0] === 'r') {
      configs[attributes[0]] = direction === directions.INNER ? ['300%', '0%'] : ['0%', '300%']
    }
    // play animation
    this.instance = anime(configs)
  }

  destroy() {
    this.instance?.seek(0)
    anime.remove(this.targets)
    this.#extraNode.remove()
    this.#lights?.remove()
    this.#lights = null
  }
}

import anime from 'animejs'
import AnimationBase from './base'
import rgba2obj from '../util/rgba2obj'

// 方向常量
const directions = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  OUTER: 'outer',
  INNER: 'inner',
}

// 渐变作用域
const scopes = {
  FILL: 'fill',
  STROKE: 'stroke',
  BOTH: 'both',
}

// 默认参数
const defaultOptions = {
  delay: 1000, 
  duration: 3000, 
  direction: directions.BOTTOM,
  scope: scopes.FILL,
  color: 'rgb(255,255,255)',
  opacity: 0.4,
  loop: true,
}

// 根据方向确定要变换的 svg 属性
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

// 渐变效果
const insertOffsets = (gradient, {color, opacity}) => {
  const {r, g, b, a} = rgba2obj(color, opacity)
  const minColor = `rgba(${r},${g},${b},0)`
  const maxColor = `rgba(${r},${g},${b},${a})`
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

// 创建横向渐变或者径向渐变，以及模糊效果
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
  return insertOffsets(targets, {color, opacity})._groups[0]
}

export default class ScanAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    const {direction, color, opacity} = this.options
    this.extraNode = context.append('defs')
    this.targets = createGradient(this.extraNode, {id: this.id, direction, color, opacity})
    this.isAnimationFirstPlay = true
  }

  play() {
    const {delay, duration, direction, scope, loop, className, context} = this.options
    const attributes = getAttributes(direction)
    const isLeftOrTop = direction === directions.LEFT || direction === directions.TOP
    const configs = {
      targets: this.targets,
      duration,
      delay,
      loop,
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      easing: 'linear',
    }
    // 首次执行添加渐变实例
    if (this.isAnimationFirstPlay) {
      this.isAnimationFirstPlay = false
      this.lights = context.selectAll(className).clone(false)
        .attr('class', 'scanAnimation-clone')
        .attr('filter', `url(#scan-filter-${this.id}`)
        .attr('stroke', scope !== scopes.FILL ? `url(#scan-${this.id})` : '')
        .style('fill', scope !== scopes.STROKE ? `url(#scan-${this.id})` : '')
        .style('pointer-events', 'none')
    }
    // 变换的动画属性
    if (attributes.length === 2) {
      configs[attributes[0]] = isLeftOrTop ? ['100%', '-100%'] : ['-100%', '100%']
      configs[attributes[1]] = isLeftOrTop ? ['200%', '0%'] : ['0%', '200%']
    } else if (attributes[0] === 'r') {
      configs[attributes[0]] = direction === directions.INNER ? ['300%', '0%'] : ['0%', '300%']
    }
    // 开始执行
    this.instance = anime(configs)
    this.event.fire('play')
  }

  destroy() {
    anime.remove(this.targets)
    this.event.fire('destroy')
    this.isAnimationAvailable = false
    this.lights?.remove()
    this.extraNode.remove()
  }
}

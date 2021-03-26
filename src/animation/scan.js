import anime from 'animejs'
import AnimationBase from './base'
import rgba2obj from '../../../common/rgba2obj'

// 方向常量
const directions = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  OUTER: 'outer',
  INNER: 'inner',
  ROTATE: 'rotate',
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
  direction: directions.HORIZONTAL,
  scope: scopes.FILL,
  color: 'rgba(255,255,255,0.4)',
  loop: true,
}
// 动画生成ID
let count = 0

// 根据方向确定要变换的 svg 属性
const getAttributes = direction => {
  let attributes
  if (direction === directions.LEFT || direction === directions.RIGHT) {
    attributes = ['x1', 'x2']
  } else if (direction === directions.TOP || direction === directions.BOTTOM) {
    attributes = ['y1', 'y2']
  } else if (direction === directions.OUTER || direction === directions.INNER) {
    attributes = ['r']
  } else if (direction === directions.ROTATE) {
    attributes = ['rotate']
  }
  return attributes
}

// 渐变效果
const insertOffsets = (gradient, color) => {
  const {r, g, b, a} = rgba2obj(color, 1)
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
const createGradient = (parentNode, direction, color) => {
  let targets
  const attributes = getAttributes(direction)
  count++
  parentNode.append('filter')
    .attr('id', `scanAnimation${count}-filter`)
    .append('feGaussianBlur')
    .attr('in', 'SourceGraphic')
    .attr('stdDeviation', 0)
  if (attributes[0] === 'rotate') {
    const gradient = parentNode.append('linearGradient')
      .attr('id', `scanAnimation${count}`)
      .attr('x1', '100%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')
    insertOffsets(gradient, color)
    targets = parentNode.append('mask')
      .attr('id', `scanAnimation${count}-mask`)
      .append('rect')
      .attr('x', '0%')
      .attr('y', '0%')
      .attr('width', '50%')
      .attr('height', '50%')
      .attr('transform-origin', '0% 0%')
      .attr('fill', `url(#scanAnimation${count})`)
      .attr('filter', `url(#scanAnimation${count}-filter)`)
  } else if (attributes[0] === 'r') {
    targets = parentNode.append('radialGradient')
      .attr('id', `scanAnimation${count}`)
      .attr(attributes[0], direction === directions.INNER ? '300%' : '0%')
  } else if (attributes.length === 2) {
    targets = parentNode.append('linearGradient')
      .attr('id', `scanAnimation${count}`)
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '0%')
      .attr(attributes[0], direction === directions.LEFT || direction === directions.TOP ? '100%' : '-100%')
      .attr(attributes[1], direction === directions.LEFT || direction === directions.TOP ? '200%' : '0%')
  }
  return direction === directions.ROTATE ? targets : insertOffsets(targets, color)
}

export default class ScanAnimation extends AnimationBase {
  constructor(options, context) {
    super(options)
    this.options = {...defaultOptions, ...options}
    this.isAnimationStart = false
    this.isAnimationAvailable = true
    const {direction, scope, targets, color} = this.options
    // 定义渐变动画
    this.extraNode = context.root.append('defs')
    this.targets = createGradient(this.extraNode, direction, color)
    // 添加渐变实例
    if (direction === directions.ROTATE) {
      this.lights = context.root.selectAll(targets).clone(false)
        .attr('filter', `url(#scanAnimation${count}-filter)`)
        .attr('mask', direction === directions.ROTATE ? `url(#scanAnimation${count}-mask)` : '')
        .attr('stroke', scope !== scopes.FILL ? 'white' : '')
        .style('fill', scope !== scopes.STROKE ? 'white' : '')
        .style('opacity', 0)
    } else {
      this.lights = context.root.selectAll(targets).clone(false)
        .attr('filter', `url(#scanAnimation${count}-filter)`)
        .attr('stroke', scope !== scopes.FILL ? `url(#scanAnimation${count})` : '')
        .style('fill', scope !== scopes.STROKE ? `url(#scanAnimation${count})` : '')
    }
  }

  play() {
    const {delay, duration, direction, loop} = this.options
    const attributes = getAttributes(direction)
    const configs = {
      targets: this.targets._groups[0],
      duration,
      delay,
      loop,
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      easing: 'linear',
    }
    // 变换的动画属性
    if (attributes.length === 2) {
      configs[attributes[0]] = direction === directions.LEFT || direction === directions.TOP ? '-100%' : '100%'
      configs[attributes[1]] = direction === directions.LEFT || direction === directions.TOP ? '0%' : '200%'
    } else if (attributes[0] === 'r') {
      configs[attributes[0]] = direction === directions.INNER ? '0%' : '300%'
    } else if (attributes[0] === 'rotate') {
      configs[attributes[0]] = 360
      this.lights.transition().style('opacity', 1).duration(2000)
    }
    this.instance = anime(configs)
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

  destory() {
    this.isAnimationAvailable = false
    this.lights.remove()
    this.instance.remove()
    this.extraNode.remove()
  }
}

import anime from 'animejs'
import * as d3 from 'd3'
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
  color: 'rgba(255,255,255,0.4)',
  loop: true,
}
// 动画生成Id
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
  const isLeftOrTop = direction === directions.LEFT || direction === directions.TOP
  ++count
  parentNode.append('filter')
    .attr('id', `scanAnimation${count}-filter`)
    .append('feGaussianBlur')
    .attr('in', 'SourceGraphic')
    .attr('stdDeviation', 0)
  if (attributes[0] === 'r') {
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
      .attr(attributes[0], isLeftOrTop ? '100%' : '-100%')
      .attr(attributes[1], isLeftOrTop ? '200%' : '0%')
  }
  return insertOffsets(targets, color)._groups[0]
}

export default class ScanAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    const {direction, color} = this.options
    this.extraNode = context.append('defs')
    this.targets = createGradient(this.extraNode, direction, color)
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
        .attr('filter', `url(#scanAnimation${count}-filter)`)
        .attr('stroke', scope !== scopes.FILL ? `url(#scanAnimation${count})` : '')
        .style('fill', scope !== scopes.STROKE ? `url(#scanAnimation${count})` : '')
        .style('pointer-events', 'none')
      // 监听属性变化以便于同步
      const targetNode = context.selectAll(className)._groups[0]
      const observers = targetNode.forEach((el, i) => {
        return new MutationObserver(mutationList => mutationList.forEach(({attributeName}) => {
          d3.select(this.lights._groups[0][i]).attr(attributeName, d3.select(el).attr(attributeName))
        })).observe(el, {attributes: true})
      })
      // 销毁时取消监听
      this.event.on('destroy', () => observers.forEach(observer => observer.disconnect()))
    }
    // 变换的动画属性
    if (attributes.length === 2) {
      configs[attributes[0]] = isLeftOrTop ? ['100%', '-100%'] : ['-100%', '100%']
      configs[attributes[1]] = isLeftOrTop ? ['200%', '0%'] : ['0%', '200%']
    } else if (attributes[0] === 'r') {
      configs[attributes[0]] = direction === directions.INNER ? ['300%', '0%'] : ['0%', '300%']
    }
    // 开始执行
    this.instance && anime.remove(this.targets)
    this.instance = anime(configs)
    this.event.has('play') && this.event.fire('play')
  }

  destroy() {
    anime.remove(this.targets)
    this.event.has('destroy') && this.event.fire('destroy')
    this.isAnimationAvailable = false
    this.lights?.remove()
    this.extraNode.remove()
  }
}

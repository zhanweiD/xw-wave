import anime from 'animejs'
import * as d3 from 'd3'
import AnimationBase from './base'

// 类型常量
const directionType = {
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
}
// 默认参数
const defaultOptions = {
  delay: 0,
  duration: 2000,
  direction: directionType.RIGHT,
  loop: false,
}
// 动画生成ID
let count = 0

// 创建擦除动画所需的元素
const createGradient = (parentNode, direction) => {
  const targets = parentNode
    .append('clipPath')
    .attr('id', `eraseAnimation${++count}`)
    .append('rect')
    .attr('x', direction === directionType.LEFT ? '100%' : '0%')
    .attr('y', direction === directionType.TOP ? '100%' : '0%')
    .attr('width', direction === directionType.LEFT || direction === directionType.RIGHT ? '0%' : '100%')
    .attr('height', direction === directionType.TOP || direction === directionType.BOTTOM ? '0%' : '100%')
  return targets._groups[0]
}

// 擦除动画效果可参考折线入场
export default class EraseAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    const {direction, targets} = this.options
    this.extraNode = context.append('defs')
    this.targets = createGradient(this.extraNode, direction)
    // 给元素设定裁剪区域
    d3.selectAll(targets).attr('clip-path', `url(#eraseAnimation${count})`)
  }

  play() {
    const {delay, duration, loop, direction} = this.options
    const isLeftOrRight = direction === directionType.LEFT || direction === directionType.RIGHT
    const isTopOrBottom = direction === directionType.TOP || direction === directionType.BOTTOM
    anime({
      targets: this.targets,
      duration,
      delay,
      loop,
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      x: direction === directionType.LEFT ? ['100%', '0%'] : '0%',
      y: direction === directionType.TOP ? ['100%', '0%'] : '0%',
      width: isLeftOrRight ? ['0%', '100%'] : '100%',
      height: isTopOrBottom ? ['0%', '100%'] : '100%',
      easing: 'linear',
    })
    this.event.has('play') && this.event.fire('play')
  }

  destroy() {
    anime.remove(this.targets)
    this.isAnimationAvailable = false
    this.event.has('destroy') && this.event.fire('destroy')
  }
}

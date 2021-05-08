import * as d3 from 'd3'
import {MoveAnimation} from '../animation'

const defaultOptions = {
  padding: 5,
  pointSize: 10,
  titleSize: 14,
  titleColor: '#383d41',
  labelSize: 12,
  labelColor: '#383d41',
  valueSize: 12,
  valueColor: '#383d41',
  gap: 20,
  enableMoveAnimation: false,
  moveAnimationDuration: 500,
  moveAnimationDelay: 0,
}

// tooltip 类
export default class Tooltip {
  constructor(container) {
    this.backup = null
    this.isMoving = false
    this.isVisible = false
    this.isAvailable = false
    this.lastPosition = {x: -100, y: -100}
    // 根容器
    this.instance = container
      .append('div')
      .attr('class', 'wave-tooltip')
      .style('border-radius', '2px')
      .style('position', 'absolute')
      .style('overflow', 'hidden')
      .style('visibility', 'hidden')
      .style('left', 0)
      .style('top', 0)
    // 模糊背景
    this.instance
      .append('div')
      .attr('class', 'wave-tooltip-bg')
      .style('filter', 'blur(1px)')
      .style('background-color', 'rgba(255,245,247,0.9)')
      .style('position', 'absolute')
      .style('width', '1000px')
      .style('height', '1000px')
  }

  show() {
    this.isVisible = true
    this.instance.style('visibility', 'visible')
    return this
  }

  hide() {
    this.isVisible = false
    this.instance.style('visibility', 'hidden')
    return this
  }

  // 更新数据
  update(list, options = {}) {
    const {
      padding,
      titleSize,
      titleColor,
      pointSize,
      labelSize,
      labelColor,
      valueSize,
      valueColor,
      gap,
    } = {...defaultOptions, ...options}
    // 转换配置数据
    const data = list.map(({fill, stroke, source}) => ({pointColor: fill || stroke, ...source}))
    // 当且仅当数据变化时进行渲染
    if (JSON.stringify(this.backup) !== JSON.stringify(data)) {
      // 头部维度信息
      this.instance
        .selectAll('.wave-tooltip-title')
        .data([data[0].dimension])
        .join('div')
        .attr('class', 'wave-tooltip-title')
        .style('padding', `${padding}px ${padding}px 0`)
        .style('font-size', `${titleSize}px`)
        .style('color', titleColor)
        .style('position', 'relative')
        .text(d => d)
      // 内容容器
      const container = this.instance
        .selectAll('.wave-tooltip-content')
        .data([null])
        .join('div')
        .attr('class', 'wave-tooltip-content fbv fbjsb fbac')
        .style('padding', '5px')
        .style('position', 'relative')
      // 每一行
      const rows = container
        .selectAll('div')
        .data(data)
        .join('div')
        .attr('class', 'fbh fbjsb fbac')
      // 行内圆点和标签
      const pointWidthLabel = rows
        .append('div')
        .attr('class', 'fbh fbjsb fbac')
        .style('margin-right', `${gap}px`)
      pointWidthLabel
        .append('div')
        .style('width', `${pointSize}px`)
        .style('height', `${pointSize}px`)
        .style('border-radius', '100%')
        .style('margin-right', '5px')
        .style('background-color', d => d.pointColor)
      pointWidthLabel
        .append('div')
        .style('font-size', `${labelSize}px`)
        .style('color', labelColor)
        .text(d => d.category)
      // 元素数值
      rows
        .append('div')
        .style('font-weight', 'bold')
        .style('font-size', `${valueSize}px`)
        .style('color', valueColor)
        .text(d => d.value)
      this.backup = data
    }
    return this
  }

  // 移动
  move({x, y}, options = {}) {
    const {enableMoveAnimation, moveAnimationDuration, moveAnimationDelay} = {...defaultOptions, ...options}
    const drift = 10
    // 边界判断
    const rect = this.instance._groups[0][0].getBoundingClientRect()
    if (x + rect.width > document.body.clientWidth) {
      x -= rect.width + drift
    } else {
      x += drift
    }
    if (y + rect.height > document.body.clientHeight) {
      y -= rect.height + drift
    } else {
      y += drift
    }
    // 移动距离过大时采用动画过渡
    const animation = new MoveAnimation({
      delay: enableMoveAnimation ? moveAnimationDelay : 0,
      targets: this.instance._groups[0][0],
      duration: enableMoveAnimation ? moveAnimationDuration : 0,
      position: [[this.lastPosition.x || 0, x], [this.lastPosition.y || 0, y]],
      easing: 'easeInOutQuint',
    })
    // 一次性动画，结束时销毁
    animation.event.on('end', () => animation.destroy())
    animation.play()
    this.lastPosition = {x, y}
    return this
  }

  destroy() {
    this.hide()
    this.backup = null
    this.isAvailable = false
    this.instance.remove()
  }
}

// 用于点击的唯一的 tooltip 实例，实现互斥
export const globalTooltip = new Tooltip(d3.select(document.body))

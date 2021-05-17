import * as d3 from 'd3'
import {isEqual, isArray} from 'lodash'
import {MoveAnimation} from '../animation'
import createLog from '../util/create-log'

// 展示类型
const modeType = {
  SINGLE: 'single', // 基于单个元素展示
  GOURP: 'group', // 基于组展示
}

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
  enableAnimation: false,
  animationDuration: 500,
  animationDelay: 0,
}

// tooltip 类
export default class Tooltip {
  constructor(container) {
    this.backup = null
    this.target = null
    this.isMoving = false
    this.isVisible = false
    this.isAvailable = false
    this.log = createLog(__filename)
    this.lastPosition = {x: -100, y: -100}
    // 根容器
    this.instance = container
      .append('div')
      .attr('class', 'wave-tooltip')
      .style('border-radius', '2px')
      .style('position', 'absolute')
      .style('overflow', 'hidden')
      .style('display', 'none')
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

  // 显示
  show() {
    this.isVisible = true
    this.instance.style('display', 'block')
    d3.select(this.target).classed('tooltip-active', true)
    return this
  }

  // 隐藏
  hide() {
    this.isVisible = false
    this.instance.style('display', 'none')
    d3.select(this.target).classed('tooltip-active', false)
    return this
  }

  // 更新数据
  update({target}, {data, backup}, options = {mode: modeType.SINGLE}) {
    const {padding, titleSize, titleColor, pointSize, labelSize, labelColor, valueSize, valueColor, gap,
    } = {...defaultOptions, ...options}
    // 计算和筛选需要展示的数据
    this.target = target
    let list
    if (options.mode === modeType.SINGLE) {
      list = [data].map(({fill, stroke, source}) => ({pointColor: fill || stroke, ...source}))
    } else if (options.mode === modeType.GOURP) {
      try {
        const elType = data.className.split('-')[2]
        const groupData = backup[elType].filter(({source}) => isEqual(source[0].dimension, data.source.dimension))[0]
        const {source, fill, stroke} = groupData
        list = source.map((item, i) => ({...item, pointColor: isArray(fill) ? fill[i] : stroke[i]}))
      } catch (e) {
        this.log.warn('此图表不支持分组 Tooltip 展示', e)
      }
    }
    // 当且仅当数据变化时进行渲染
    if (isArray(list) && !isEqual(this.backup, list)) {
      // 头部维度信息
      this.instance
        .selectAll('.wave-tooltip-title')
        .data([list[0].dimension])
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
      container.selectAll('div').remove()
      const rows = container
        .selectAll('div')
        .data(list)
        .join('div')
        .attr('class', 'fbh fbjsb fbac')
        .style('width', '100%')
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
      this.backup = list
    }
    return this
  }

  // 移动
  move({x, y}, options = {}) {
    const {enableAnimation, animationDuration, animationDelay} = {...defaultOptions, ...options}
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
      delay: enableAnimation ? animationDelay : 0,
      targets: this.instance._groups[0][0],
      duration: enableAnimation ? animationDuration : 0,
      position: [[this.lastPosition.x || 0, x], [this.lastPosition.y || 0, y]],
      easing: 'easeOutQuart',
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

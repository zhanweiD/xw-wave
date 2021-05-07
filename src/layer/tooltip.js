import ReactDOM from 'react-dom'
import * as d3 from 'd3'
import {MoveAnimation} from '../animation'

// tooltip 类
export default class Tooltip {
  constructor(container) {
    this.backup = null
    this.isMoving = false
    this.isVisible = false
    this.isAvailable = false
    this.lastPosition = {x: -100, y: -100}
    this.instance = container
      .append('div')
      .attr('class', 'wave-tooltip')
      .style('border-radius', '2px')
      .style('position', 'absolute')
      .style('overflow', 'hidden')
      .style('display', 'none')
      .style('left', 0)
      .style('top', 0)
  }

  show() {
    this.isVisible = true
    this.instance.style('display', 'block')
    return this
  }

  hide() {
    this.isVisible = false
    this.instance.style('display', 'none')
    return this
  }

  // 更新数据
  update(list) {
    // 生成 tooltip 数据
    const data = list.map(({fill, stroke, source}) => {
      const pointColor = fill || stroke
      const [label, value] = [source.dimension, source.value]
      return {pointColor, label, value}
    })
    // 当且仅当数据变化时进行渲染
    if (JSON.stringify(this.backup) !== JSON.stringify(data)) {
      this.instance.selectAll('div').remove()
      // 背景模糊
      this.instance
        .append('div')
        .style('filter', 'blur(1px)')
        .style('background-color', 'rgba(255,245,247,0.9)')
        .style('position', 'absolute')
        .style('width', '1000px')
        .style('height', '1000px')
      // 内容容器
      const container = this.instance
        .append('div')
        .attr('class', 'fbv fbjsb fbac')
        .style('font-size', '12px')
        .style('color', '#383d41')
        .style('padding', '5px')
        .style('position', 'relative')
      // 每一行
      const rows = container
        .selectAll('div')
        .data(data).join('div')
        .attr('class', 'fbh fbjsb fbac')
      // 行内圆点和标签
      const pointWidthLabel = rows
        .append('div')
        .attr('class', 'fbh fbjsb fbac')
        .style('margin-right', '20px')
      pointWidthLabel
        .append('div')
        .style('width', '10px')
        .style('height', '10px')
        .style('border-radius', '100%')
        .style('margin-right', '5px')
        .style('background-color', d => d.pointColor)
      pointWidthLabel
        .append('div')
        .text(d => d.label).style
      // 元素数值
      rows
        .append('div')
        .style('font-weight', 'bold')
        .text(d => d.value)
      this.backup = data
    }
    return this
  }

  // 移动
  move({x, y}) {
    const threshold = 10
    const [offsetX, offsetY] = [x - this.lastPosition.x, y - this.lastPosition.y]
    const drift = 10
    // 移动距离过大时采用动画过渡
    const animation = new MoveAnimation({
      delay: 0,
      targets: this.instance._groups[0][0],
      duration: Math.abs(offsetX) > threshold || Math.abs(offsetY) > threshold ? 500 : 0,
      position: [[this.lastPosition.x || 0, x + drift], [this.lastPosition.y || 0, y + drift]],
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
    ReactDOM.unmountComponentAtNode(this.instance._groups[0])
  }
}

// 用于点击的唯一的 tooltip 实例，实现互斥
export const globalTooltip = new Tooltip(d3.select(document.body))

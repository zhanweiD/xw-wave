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
      .style('position', 'absolute')
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
      this.instance.append('div').text('test')
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

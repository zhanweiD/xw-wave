import * as d3 from 'd3'
import LayerBase from './base'
// import uuid from '../util/uuid'
import drawLine from '../basic/line'
import drawText from '../basic/text'
import getTextHeight from '../util/text-height'
import drawCircle from '../basic/circle'

const defaultStyle = {
  type: 'axisX', // asisX asisY radius angular 4种坐标
  orient: 'left', // 坐标轴位置

  isShowTickLine: true, // 是否显示坐标线
  tickLine: {className: 'axis-line'}, // TODO：刻度线的样式，引用线的样式

  //   isShowAuxiliaryLine: false, // 是否显示辅助线
  //   auxiliaryLine: {}, // 辅助线的样式

  isShowLabel: true,
  label: {
    textAnchor: 'middle', 
    className: 'axis-label',
    fontSize: 12,
  }, // TODO：标签的样式，引用文本的样式
}
export default class AxisLayer extends LayerBase {
  #container

  #layout

  #scale

  #style

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    // 初始化默认值
    this.#container = this.options.root.append('g').attr('class', 'wave-axis')
    this.style(defaultStyle)
  }

  // 读取布局信息
  layout(layout) {
    this.#layout = layout
  }

  // 自定义坐标轴的时候？
  scale(scale) {
    this.#scale = scale
  }

  style(style) {
    this.#style = this.#style ? Object.assign(this.#style, style) : style
  }

  draw() {
    // todo：感觉此处做了过多的业务侧的事，不够纯粹
    let domain = this.#scale.domain()
    if (this.#scale.type === 'linear' || this.#scale.type === 'quantize') {
      domain = tickValues(this.#scale, this.#scale.nice.count, 0)
    }
    if (this.#style.isShowTickLine) {
      if (this.#style.type === 'radius') {
        this._drawRadiusLine({domain})
      } else if (this.#style.type === 'angle') {
        this._drawAngleLine({domain})
      } else {
        this.#drawTickLine({domain})
      }
    }
    if (this.#style.isShowLabel) {
      if (this.#style.type === 'axisX' || this.#style.type === 'axisY') {
        this._drawTickLabel({domain})
      }
    }
  }

  // 画坐标线
  #drawTickLine = ({domain}) => {
    const tickLinePosition = domain.map(label => {
      if (this.#style.type === 'axisY' && this.#scale.type === 'band') {
        const x1 = this.#layout.left
        const y = this.#scale(label) + this.#layout.top + (this.#scale.bandwidth() / 2)
        const x2 = x1 + this.#layout.width
        return [x1, y, x2, y]
      }
      if (this.#style.type === 'axisX' && this.#scale.type === 'band') {
        const x = this.#scale(label) + this.#layout.left + (this.#scale.bandwidth() / 2)
        const y = this.#layout.height + this.#layout.top
        return [x, y, x, y + 5]
      }
      if (this.#style.type === 'axisY') {
        const x1 = this.#layout.left
        const y = this.#layout.top + this.#layout.height - this.#scale(label)
        const x2 = x1 + this.#layout.width
        return [x1, y, x2, y]
      }
      const positionX = this.#scale(label) + this.#layout.left
      const posirionY = this.#layout.height + this.#layout.top
      return [positionX, posirionY, positionX, posirionY + 5]
    })
    const lineBox = this.#container.append('g').attr('class', 'wave-axis-line')
    drawLine({position: tickLinePosition, container: lineBox, ...this.#style.tickLine})
  }

  // 画文字
  _drawTickLabel({domain}) {
    const labelPosition = domain.map(label => {
      if (this.#style.type === 'axisY' && this.#scale.type === 'linear') {
        let x = this.#layout.left
        if (this.#style.orient === 'right') {
          x = this.#layout.right
        }
        const y = this.#layout.top + this.#layout.height + getTextHeight(this.#style.label.fontSize) - this.#scale(label) 
        return [x, y]
      }
      if (this.#style.type === 'axisY' && this.#scale.type === 'band') {
        const x = this.#layout.left
        const y = this.#scale(label) + this.#layout.top + getTextHeight(this.#style.label.fontSize) + (this.#scale.bandwidth() / 2)      
        return [x, y]
      }
      if (this.#style.type === 'axisX' && this.#scale.type === 'band') {
        const x = this.#scale(label) + this.#layout.left + (this.#scale.bandwidth() / 2)
        const y = this.#layout.height + this.#layout.top
        return [x, y + getTextHeight(this.#style.label.fontSize)]
      }
      if (this.#style.type === 'axisY') {
        let x = this.#layout.left
        if (this.#style.orient === 'right') {
          x = this.#layout.right
        }
        const y = this.#layout.top + this.#layout.height + getTextHeight(this.#style.label.fontSize) - this.#scale(label) 
        return [x, y]
      }
      const positionX = this.#scale(label) + this.#layout.left
      const positionY = this.#layout.height + this.#layout.top
      return [positionX, positionY + getTextHeight(this.#style.label.fontSize)]
    })
    const textBox = this.#container.append('g').attr('class', 'wave-axis-text')
    drawText({data: domain, position: labelPosition, container: textBox, ...this.#style.label})
  }

  // 画极坐标圆
  _drawRadiusLine({domain}) {
    const data = domain.map(label => ([this.#scale(label), this.#scale(label)]))
    const position = domain.map(() => ([this.#layout.width / 2 + this.#layout.left, this.#layout.height / 2 + this.#layout.top]))
    const lineBox = this.#container.append('g').attr('class', 'wave-axis-line')
    drawCircle({data, position, container: lineBox, ...this.#style.tickLine})
  }

  _drawAngleLine({domain}) {
    const angle = 360 / domain.length
    const x = this.#layout.width / 2 + this.#layout.left
    const y = this.#layout.top + this.#layout.height / 2
    const lineBox = this.#container.append('g').attr('class', 'wave-axis-line')
    const g = lineBox.attr('class', 'wave-axis-angle-line')
      .selectAll('g')
      .data(d3.range(-90, 270, angle))
      .enter()
      .append('g')
      .attr('transform', d => {
        return `translate(${x}, ${y}) rotate(${d})`
      })
    const tickLinePosition = [0, 0, Math.min(this.#layout.width / 2, this.#layout.height / 2), 0]
    g.each((x, i, elm) => {
      drawLine({position: [tickLinePosition], container: d3.select(elm[i]), ...this.#style.tickLine})
    })
  }
}

function tickValues(scale, tickCount = 6, fixed = 0) {
  const domain = scale.domain()
  const distance = domain[1] - domain[0]
  
  if (distance === 0 || tickCount === 0) {
    return []
  }

  const step = distance / tickCount
  const result = []

  for (let i = 0; i < tickCount + 1; i += 1) {
    let value = step * i + domain[0]
    if (fixed === Math.abs(fixed)) {
      const multi = 10 ** Math.floor(fixed)
      value = domain[1] / tickCount > 2 ? Math.round(value * multi) / multi : Number((value * multi / multi).toFixed(2))
    }
    result[i] = value
  }

  return result
}

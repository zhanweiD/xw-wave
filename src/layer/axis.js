import * as d3 from 'd3'
import LayerBase from './base'
import drawLine from '../basic/line'
import drawText from '../basic/text'
import getTextHeight from '../util/text-height'
import drawCircle from '../basic/circle'
import uuid from '../util/uuid'

export default class AxisLayer extends LayerBase {
  #container

  #layout

  #scale

  #style = {
    type: 'axisX', // asisX asisY radius angular 4种坐标
    orient: 'left', // 坐标轴位置
    isTickLineVisible: true, // 是否显示坐标线
    tickLine: {}, // TODO：刻度线的样式，引用线的样式
    isLabelVisible: true,
    label: {
      fontSize: 12,
    }, // TODO：标签的样式，引用文本的样式
    updateAnimationDuration: 1000,
    updateAnimationDelay: 0,
    enableUpdateAnimation: false,
  }

  #id = uuid()

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    // 初始化默认值
    this.#container = this.options.root.append('g').attr('class', 'wave-axis')
    // 两个容器初始化时完成
    this.#container.append('g').attr('class', 'wave-axis-line')
    this.#container.append('g').attr('class', 'wave-axis-text')
  }

  // 读取布局信息
  setLayout(layout) {
    this.#layout = layout
  }

  // 自定义坐标轴的时候？
  setScale(scale) {
    this.#scale = scale
    this.#niceStyle()
  }

  setStyle(style) {
    this.#style = this.#style ? Object.assign(this.#style, style) : style
    this.#niceStyle()
  }

  // 此处处理不同坐标轴样式上的差异
  #niceStyle = () => {
    const {
      type = 'axisX',
      enableUpdateAnimation = false,
    } = this.#style

    if (type === 'axisX') {
      this.#style.label.textAnchor = 'middle'
    }
    if (type === 'axisY') {
      if (this.#scale && this.#scale.type === 'band') {
        this.#style.label.textAnchor = 'start'
        if (this.#style.orient === 'right') {
          this.#style.label.textAnchor = 'end'
        }
        this.#style.tickLine.opacity = 0
      }
      if (this.#scale && this.#scale.type === 'linear') {
        this.#style.label.textAnchor = 'start'
        if (this.#style.orient === 'right') {
          this.#style.label.textAnchor = 'end'
        }
      }
    }

    if (enableUpdateAnimation) {
      this.#style.label.enableUpdateAnimation = true
      this.#style.label.updateAnimationDuration = this.#style.updateAnimationDuration || 1000
      this.#style.label.updateAnimationDelay = this.#style.updateAnimationDelay || 0
      this.#style.tickLine.enableUpdateAnimation = true
      this.#style.tickLine.updateAnimationDuration = this.#style.updateAnimationDuration || 1000
      this.#style.tickLine.updateAnimationDelay = this.#style.updateAnimationDelay || 0  
    }
  }

  draw() {
    // 每次draw前先清除，最暴力的做法
    // this.#container.selectAll('*').remove()
    // 真正去画
    // todo：感觉此处做了过多的业务侧的事，不够纯粹
    let domain = this.#scale.domain()
    if (this.#scale.type === 'linear' || this.#scale.type === 'quantize') {
      domain = tickValues(this.#scale, this.#scale.nice.count, 0)
    }
    if (this.#style.isTickLineVisible) {
      if (this.#style.type === 'radius') {
        this._drawRadiusLine({domain})
      } else if (this.#style.type === 'angle') {
        this._drawAngleLine({domain})
      } else {
        this.#drawTickLine({domain})
      }
    }
    if (this.#style.isLabelVisible) {
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
        const y = this.#layout.top + this.#scale(label)
        const x2 = x1 + this.#layout.width
        return [x1, y, x2, y]
      }
      const positionX = this.#scale(label) + this.#layout.left
      const posirionY = this.#layout.height + this.#layout.top
      return [positionX, posirionY, positionX, posirionY + 5]
    })
    const lineBox = this.#container.selectAll('.wave-axis-line')
    const className = `asix-tick-line-${this.#id}`
    drawLine({position: tickLinePosition, container: lineBox, ...this.#style.tickLine, className})
  }

  // 画文字
  _drawTickLabel({domain}) {
    const labelPosition = domain.map(label => {
      if (this.#style.type === 'axisY' && this.#scale.type === 'band') {
        let x = this.#layout.left
        if (this.#style.orient === 'right') {
          x = this.#layout.right
        }
        const y = this.#scale(label) + this.#layout.top + this.#style.label.fontSize / 2 + (this.#scale.bandwidth() / 2)      
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
        const y = this.#layout.top + getTextHeight(this.#style.label.fontSize) + this.#scale(label) 
        return [x, y]
      }
      const positionX = this.#scale(label) + this.#layout.left
      const positionY = this.#layout.height + this.#layout.top
      return [positionX, positionY + getTextHeight(this.#style.label.fontSize)]
    })
    const textBox = this.#container.selectAll('.wave-axis-text')
    const className = `asix-tick-text-${this.#id}`
    drawText({data: domain, position: labelPosition, container: textBox, ...this.#style.label, className})
  }

  // 画极坐标圆
  _drawRadiusLine({domain}) {
    const data = domain.map(label => ([this.#scale(label), this.#scale(label)]))
    const position = domain.map(() => ([this.#layout.width / 2 + this.#layout.left, this.#layout.height / 2 + this.#layout.top]))
    const lineBox = this.#container.selectAll('.wave-axis-line')
    const className = `asix-tick-line-${this.#id}`
    drawCircle({data, position, container: lineBox, ...this.#style.tickLine, className})
  }

  _drawAngleLine({domain}) {
    const angle = 360 / domain.length
    const x = this.#layout.width / 2 + this.#layout.left
    const y = this.#layout.top + this.#layout.height / 2
    const lineBox = this.#container.selectAll('.wave-axis-line')
    const g = lineBox.attr('class', 'wave-axis-angle-line')
      .selectAll('g')
      .data(d3.range(-90, 270, angle))
      .enter()
      .append('g')
      .attr('transform', d => {
        return `translate(${x}, ${y}) rotate(${d})`
      })
    const tickLinePosition = [0, 0, Math.min(this.#layout.width / 2, this.#layout.height / 2), 0]
    const className = `asix-tick-line-${this.#id}`
    // const classNameText = `asix-tick-text-${this.#id}`
    
    g.each((data, i, elm) => {
      drawLine({position: [tickLinePosition], container: d3.select(elm[i]), ...this.#style.tickLine, className})
      // drawText({position: [[Math.min(this.#layout.width / 2, this.#layout.height / 2) + 20, 0]], data: [`标签${i}`], className: classNameText, container: d3.select(elm[i])})
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

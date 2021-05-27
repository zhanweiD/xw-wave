import * as d3 from 'd3'
import LayerBase from './base'

// 辅助线方向
const axisType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  RADIUS: 'radius',
  ANGLE: 'angle',
}

// 默认样式
const defaultStyle = {
  labelOffset: 5,
  line: {
    stroke: 'white',
    strokeWidth: 1,
    fillOpacity: 0,
    opacity: 0.2,
  },
  text: {
    opacity: 0.8,
    fontSize: 8,
  },
}

// 辅助线图层
export default class AxisLayer extends LayerBase {
  #scale = null

  #style = defaultStyle

  #lineData = []

  #textData = []

  get scale() {
    return this.#scale
  }

  get style() {
    return this.#style
  }

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    const {type = axisType.HORIZONTAL} = this.options
    this.className = `wave-axis-${type}`
  }

  // 传入数据数组和比例尺，辅助线需要外部的比例尺
  setData(data, scale) {
    this.#scale = scale || this.#scale
    const {type = axisType.HORIZONTAL, layout} = this.options
    const {left, top, width, height} = layout
    // 获取坐标值
    const position = []
    if (this.#scale.type === 'band' || this.#scale.type === 'point') {
      const isCartesianCoordinate = type === axisType.HORIZONTAL || type === axisType.VERTICAL
      const needOffset = this.#scale.type === 'band' && isCartesianCoordinate
      this.#scale.domain().forEach(label => {
        position.push([label, this.#scale(label) + (needOffset ? this.#scale.bandwidth() / 2 : 0)])
      })
    } else if (this.#scale.type === 'linear') {
      const [min, max] = this.#scale.domain()
      d3.range(min, max + 1, (max - min) / (this.#scale.nice.count)).forEach(label => {
        position.push([label, this.#scale(label)])
      })
    }
    // 水平坐标轴(分割宽度垂直线)
    if (type === axisType.HORIZONTAL) {
      this.#lineData = position.map(([label, value]) => ({
        value: label,
        x1: left + value,
        x2: left + value,
        y1: top,
        y2: top + height,
      }))
    }
    // 垂直坐标轴(分割高度水平线)
    if (type === axisType.VERTICAL) {
      this.#lineData = position.map(([label, value]) => ({
        value: label,
        x1: left,
        x2: left + width,
        y1: top + value,
        y2: top + value,
      }))
    }
    // 角度坐标轴(分割角度射线)
    if (type === axisType.ANGLE) {
      const maxRadius = Math.max(width / 2, height / 2)
      this.#lineData = position.map(([label, value]) => ({
        value: label,
        angle: value,
        x1: left + width / 2,
        y1: top + height / 2,
        x2: left + width / 2 + Math.sin((value / 180) * Math.PI) * maxRadius,
        y2: top + height / 2 - Math.cos((value / 180) * Math.PI) * maxRadius,
      }))
    }
    // 半径坐标轴(半径圆环)
    if (type === axisType.RADIUS) {
      this.#lineData = position.map(([label, value]) => ({
        value: label,
        cx: left + width / 2,
        cy: top + height / 2,
        rx: value,
        ry: value,
      }))
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {labelOffset, text} = this.#style
    const {fontSize = 12, format} = text
    const {type} = this.options
    this.#textData = this.#lineData.map(({value, x1, y1, x2, y2, cx, cy, rx, angle}) => {
      const basicTextData = {value, fontSize, format, offset: labelOffset}
      // X轴坐标在线的正下方
      if (type === axisType.HORIZONTAL) {
        return this.createText({x: x2, y: y2, position: 'bottom', ...basicTextData})
      }
      // Y轴坐标在线的左下方
      if (type === axisType.VERTICAL) {
        const offset = this.#scale.type === 'linear' ? fontSize : fontSize / 2 + basicTextData.offset
        return this.createText({x: x1, y: y1 + offset, ...basicTextData})
      }
      // 角度坐标在线的延伸处（和饼图外部坐标一样）
      if (type === axisType.ANGLE) {
        const relativeAngle = Math.abs((angle + 360) % 360)
        const position = relativeAngle === 0 ? 'top'
          : relativeAngle === 180 ? 'bottom'
            : relativeAngle > 180 ? 'left'
              : relativeAngle < 180 ? 'right' : 'default'
        return this.createText({x: x2, y: y2, position, ...basicTextData})
      }
      // 半径坐标在角度坐标第一根线的右侧
      if (type === axisType.RADIUS) {
        return this.createText({x: cx, y: cy - rx, position: 'right', ...basicTextData})
      }
      return null
    })
  }

  // 绘制
  draw() {
    const [axis, scale] = [this.options.type, this.#scale.type]
    const isCartesianCoordinate = axis === axisType.HORIZONTAL || axis === axisType.VERTICAL
    const lineData = [{
      position: this.#lineData.map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
      ...this.#style.line,
    }]
    const circleData = [{
      data: this.#lineData.map(({rx, ry}) => [rx, ry]),
      position: this.#lineData.map(({cx, cy}) => [cx, cy]),
      ...this.#style.line,
    }]
    const textData = this.#textData.map(({value, x, y}) => ({
      data: [value],
      position: [[x, y]],
      ...this.#style.text,
    }));
    (scale === 'linear' || !isCartesianCoordinate) && this.drawBasic('line', lineData)
    axis === axisType.RADIUS && this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

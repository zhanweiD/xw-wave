import * as d3 from 'd3'
import LayerBase from './base'

// 坐标类型，单个或者组合
const axisType = {
  CARTESIAN: 'cartesian', // 由于布局的问题直角坐标组合暂不可用
  POLAR: 'polar',
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

// 判定是否直角坐标系
const isCartesian = type => {
  return type === axisType.CARTESIAN || type === axisType.HORIZONTAL || type === axisType.VERTICAL
}

// 坐标轴图层
export default class AxisLayer extends LayerBase {
  #scale = {}

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
    this.#lineData = []
    this.#scale = scale || this.#scale
    const {type = axisType.HORIZONTAL, layout} = this.options
    const {left, top, width, height} = layout
    // 获取坐标值
    const getPosition = targetScale => {
      const position = []
      if (targetScale.type === 'band' || targetScale.type === 'point') {
        const needOffset = targetScale.type === 'band' && isCartesian(type)
        targetScale.domain().forEach(label => {
          position.push([label, targetScale(label) + (needOffset ? targetScale.bandwidth() / 2 : 0)])
        })
      } else if (targetScale.type === 'linear') {
        const [min, max] = targetScale.domain()
        d3.range(min, max + 1, (max - min) / (targetScale.nice.count)).forEach(label => {
          position.push([label, targetScale(label)])
        })
      }
      return position
    }
    // 水平坐标轴(分割宽度垂直线)
    if (type === axisType.HORIZONTAL || type === axisType.CARTESIAN) {
      const position = getPosition(this.#scale.scaleX)
      this.#lineData = this.#lineData.concat(position.map(([label, value]) => ({
        value: label,
        x1: left + value,
        x2: left + value,
        y1: top,
        y2: top + height,
      }))) 
    }
    // 垂直坐标轴(分割高度水平线)
    if (type === axisType.VERTICAL || type === axisType.CARTESIAN) {
      const position = getPosition(this.#scale.scaleY)
      this.#lineData = this.#lineData.concat(position.map(([label, value]) => ({
        value: label,
        x1: left,
        x2: left + width,
        y1: top + value,
        y2: top + value,
      })))
    }
    // 角度坐标轴(分割角度射线)
    if (type === axisType.ANGLE || type === axisType.POLAR) {
      const position = getPosition(this.#scale.scaleAngle)
      const maxRadius = this.#scale.scaleRadius?.range()[1] || Math.max(width / 2, height / 2)
      this.#lineData = this.#lineData.concat(position.map(([label, value]) => ({
        value: label,
        angle: value,
        x1: left + width / 2,
        y1: top + height / 2,
        x2: left + width / 2 + Math.sin((value / 180) * Math.PI) * maxRadius,
        y2: top + height / 2 - Math.cos((value / 180) * Math.PI) * maxRadius,
      })))
    }
    // 半径坐标轴(半径圆环)
    if (type === axisType.RADIUS || type === axisType.POLAR) {
      const position = getPosition(this.#scale.scaleRadius)
      this.#lineData = this.#lineData.concat(position.map(([label, value]) => ({
        value: label,
        cx: left + width / 2,
        cy: top + height / 2,
        rx: value,
        ry: value,
      })))
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
      if (type === axisType.HORIZONTAL || type === axisType.CARTESIAN) {
        return this.createText({x: x2, y: y2, position: 'bottom', ...basicTextData})
      }
      // Y轴坐标在线的左下方
      if (type === axisType.VERTICAL || type === axisType.CARTESIAN) {
        const offset = basicTextData.offset + (this.#scale.scaleY.type === 'linear' ? fontSize : 0)
        return this.createText({x: x1, y: y1 + offset, ...basicTextData})
      }
      // 角度坐标在线的延伸处（和饼图外部坐标一样）
      if ((type === axisType.ANGLE || type === axisType.POLAR) && x2 && y2) {
        const relativeAngle = Math.abs((angle + 360) % 360)
        const position = relativeAngle === 0 ? 'top'
          : relativeAngle === 180 ? 'bottom'
            : relativeAngle > 180 ? 'left'
              : relativeAngle < 180 ? 'right' : 'default'
        return this.createText({x: x2, y: y2, position, ...basicTextData})
      }
      // 半径坐标在角度坐标第一根线的右侧
      if (type === axisType.RADIUS || type === axisType.POLAR) {
        return this.createText({x: cx, y: cy - rx, position: 'right', ...basicTextData})
      }
      return null
    })
  }

  // 绘制
  draw() {
    const {type} = this.options
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
    }))
    // 澜图特色坐标轴视觉支持
    if (type === axisType.CARTESIAN) {
      this.#scale.scaleX?.type !== 'linear' && lineData[0].position.splice(0, this.#scale.scaleX.domain().length)
      this.#scale.scaleY?.type !== 'linear' && lineData[0].position.splice(this.#scale.scaleX.domain().length)
    } else if (type === axisType.HORIZONTAL) {
      this.#scale.scaleX?.type !== 'linear' && lineData[0].position.splice(0)
    } else if (type === axisType.VERTICAL) {
      this.#scale.scaleY?.type !== 'linear' && lineData[0].position.splice(0)
    }
    this.drawBasic('circle', circleData)
    this.drawBasic('line', lineData)
    this.drawBasic('text', textData)
  }
}

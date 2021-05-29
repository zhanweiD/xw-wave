import {sum, max} from 'd3'
import {cloneDeep, isArray} from 'lodash'
import LayerBase from './base'
import getTextWidth from '../util/text-width'
import formatText from '../util/format-text'

// 对齐方式
const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

// 排列方向
const directionType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

// 默认样式
const defaultStyle = {
  align: alignType.START,
  verticalAlign: alignType.END,
  direction: directionType.HORIZONTAL,
  gap: [0, 0],
  pointSize: 12,
  text: {
    fill: 'white',
  },
  point: {},
}

// 图例图层
export default class LegendLayer extends LayerBase {
  #data = []

  #style = defaultStyle

  #textData = []

  #circleData = []

  #colors = []

  #textColors = []

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    this.className = 'wave-legend'
  }

  /**
   * 传入图例数据
   * @param {LayerBase} layer 
   */
  setData(layers) {
    // 初始化文字数据和图形颜色
    layers = isArray(layers) ? layers : [layers]
    layers.forEach(({data, options}) => {
      this.#data.push(...data.data.slice(1).map(({header}) => header))
      this.#colors.push(...options.getColor(data.data.length - 1))
      this.#textColors.push(...new Array(data.data.length - 1).fill('white'))
    })
    // 状态变量，用于恢复数据
    const originData = layers.map(layer => layer.data)
    const colors = cloneDeep(this.#colors)
    const counts = layers.map(({data}) => data.data.length - 1)
    const disableColor = '#E2E3E588'
    const disableFlag = new Array(this.#colors.length).fill(false)
    // 数据筛选
    this.event.off('click-circle')
    this.event.on('click-circle', object => {
      const {index} = object.data.source
      const layerIndex = counts.findIndex((v, i) => counts.slice(0, i + 1).reduce((prev, cur) => prev + cur) > index)
      const startIndex = counts.slice(0, layerIndex).reduce((prev, cur) => prev + cur, 0)
      const data = originData[layerIndex]
      const layer = layers[layerIndex]
      // 更新图例状态
      if (disableFlag[index]) {
        disableFlag[index] = false
        this.#colors[index] = colors[index]
        this.#textColors[index] = 'white'
      } else {
        disableFlag[index] = true
        this.#colors[index] = disableColor
        this.#textColors[index] = disableColor
      }
      // 更新图层
      const headers = data.data.filter((v, i) => (!i || !disableFlag[startIndex + i - 1])).map(({header}) => header)
      layer.setData(data.select(headers))
      layer.setStyle()
      layer.draw()
      // 更新图例
      this.setStyle()
      this.draw()
    })
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {align, verticalAlign, direction, pointSize} = this.#style
    const {left, top, width, height} = this.options.layout
    const {fontSize = 12, format} = this.#style.text
    const [inner, outer] = this.#style.gap
    const maxHeight = max([pointSize, fontSize])
    // 格式化图例数据
    const data = format ? this.#data.map(value => formatText(value, format)) : this.#data
    // 确定圆的数据
    if (direction === directionType.HORIZONTAL) {
      this.#circleData = data.map((item, i) => {
        const textWidth = sum(data.slice(0, i).map(value => getTextWidth(value, fontSize)))
        return {
          cx: left + pointSize / 2 + (i ? (inner + outer + pointSize) * i + textWidth : 0),
          cy: top + maxHeight / 2,
          rx: pointSize / 2,
          ry: pointSize / 2,
        }
      })
    } else if (direction === directionType.VERTICAL) {
      this.#circleData = data.map((item, i) => ({
        cx: left + pointSize / 2,
        cy: top + maxHeight / 2 + (i ? (outer + fontSize + pointSize) * i : 0),
        rx: pointSize / 2,
        ry: pointSize / 2,
      }))
    }
    // 根据圆的数据确定文字的数据
    this.#textData = this.#circleData.map(({cx, cy}, i) => ({
      value: data[i],
      x: cx + pointSize / 2 + inner,
      y: cy + fontSize / 2,
    }))
    // 最后根据 align 整体移动，默认都是 start
    let [totalWidth, totalHeight] = [0, 0]
    if (direction === directionType.HORIZONTAL) {
      const {x, value} = this.#textData[this.#textData.length - 1]
      totalWidth = x - left + getTextWidth(value, fontSize)
      totalHeight = maxHeight
    } else if (direction === directionType.VERTICAL) {
      const {y} = this.#textData[this.#textData.length - 1]
      totalWidth = pointSize + inner + max(data.map(value => getTextWidth(value, fontSize)))
      totalHeight = y - top + maxHeight
    }
    const [offsetX, offsetY] = [width - totalWidth, height - totalHeight]
    const [isHorizontalMiddle, isHorizontalEnd] = [align === alignType.MIDDLE, align === alignType.END]
    const [isVerticalMiddle, isVerticalEnd] = [verticalAlign === alignType.MIDDLE, verticalAlign === alignType.END]
    this.#circleData = this.#circleData.map(({cx, cy, ...size}) => ({
      ...size,
      cx: cx + (isHorizontalMiddle ? offsetX / 2 : isHorizontalEnd ? offsetX : 0),
      cy: cy + (isVerticalMiddle ? offsetY / 2 : isVerticalEnd ? offsetY : 0), 
    }))
    this.#textData = this.#textData.map(({x, y, value}) => ({
      value,
      x: x + (isHorizontalMiddle ? offsetX / 2 : isHorizontalEnd ? offsetX : 0),
      y: y + (isVerticalMiddle ? offsetY / 2 : isVerticalEnd ? offsetY : 0),
    }))
  }

  draw() {
    const circleData = this.#circleData.map(({rx, ry, cx, cy}, i) => ({
      data: [[rx, ry]],
      position: [[cx, cy]],
      fill: this.#colors[i],
      source: [{value: this.#data[i], index: i}],
      ...this.#style.circle,
    }))
    const textData = this.#textData.map(({value, x, y}, i) => ({
      data: [value],
      position: [[x, y]],
      ...this.#style.text,
      fill: this.#textColors[i],
    }))
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

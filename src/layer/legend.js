import {sum, max} from 'd3'
import {cloneDeep} from 'lodash'
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
  align: alignType.END,
  verticalAlign: alignType.START,
  direction: directionType.HORIZONTAL,
  offset: [0, 0],
  gap: [0, 0],
  circleSize: 12,
  text: {
    fill: 'white',
  },
  circle: {},
}

// 图例图层
export default class LegendLayer extends LayerBase {
  #data = []

  #textData = []

  #circleData = []

  #colors = []

  #textColors = []

  #layers = null

  #isFiltering = false

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['text', 'circle'])
    this.className = 'wave-legend'
  }

  // 图例过滤逻辑
  #filter = () => {
    // 备份用于恢复数据
    const originData = this.#layers.map(layer => layer.data)
    const colors = cloneDeep(this.#colors)
    const counts = this.#layers.map(({data}) => data.data.length - 1)
    const disableFlag = new Array(this.#colors.length).fill(false)
    const disableColor = '#E2E3E588'
    // 数据筛选
    this.event.off('click-circle')
    this.event.on('click-circle', object => {
      const {index} = object.data.source
      const layerIndex = counts.findIndex((v, i) => counts.slice(0, i + 1).reduce((prev, cur) => prev + cur) > index)
      const startIndex = counts.slice(0, layerIndex).reduce((prev, cur) => prev + cur, 0)
      const data = originData[layerIndex]
      const layer = this.#layers[layerIndex]
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
      const order = {}
      const subHeaders = data.data.filter((v, i) => (!i || !disableFlag[startIndex + i - 1])).map(({header}) => header)
      const subData = data.select(subHeaders)
      data.data.slice(1).map(({header}) => header).forEach((header, i) => order[header] = i)
      subData.options.order = order
      try {
        // 表示当前图层重绘制来自于图例过滤
        this.#isFiltering = true
        layer.setData(subData)
        layer.setStyle()
        layer.draw()
      } catch (error) {
        this.warn('图例数据过滤错误', {error, data: subData})
      }
      // 更新图例
      this.setStyle()
      this.draw()
    })
  }

  /**
   * 传入图例数据
   * @param {Array<LayerBase>} layers 图层数组 
   */
  setData(layers) {
    this.#isFiltering = false
    this.#layers = layers || this.#layers
    // 初始化文字数据和图形颜色
    this.#data = []
    this.#colors = []
    this.#textColors = []
    this.#layers.forEach(layer => {
      this.#data.push(...layer.data.data.slice(1).map(({header}) => header))
      this.#colors.push(...layer.getColor(layer.data.data.length - 1))
      this.#textColors.push(...new Array(layer.data.data.length - 1).fill('white'))
    })
    // 生命周期绑定
    layers && this.#filter()
    layers && this.#layers.forEach(layer => layer.event.on('draw', () => {
      if (!this.#isFiltering) {
        this.setData()
        this.setStyle()
        this.draw()
      }
    }))
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {align, verticalAlign, direction, circleSize, offset, gap} = this.#style
    const {left, top, width, height} = this.options.layout
    const {fontSize = 12, format} = this.#style.text
    const [inner, outer] = gap
    const maxHeight = max([circleSize, fontSize])
    // 格式化图例数据
    const data = format ? this.#data.map(value => formatText(value, format)) : this.#data
    // 确定圆的数据
    if (direction === directionType.HORIZONTAL) {
      this.#circleData = data.map((item, i) => {
        const textWidth = sum(data.slice(0, i).map(value => getTextWidth(value, fontSize)))
        return {
          cx: left + circleSize / 2 + (i ? (inner + outer + circleSize) * i + textWidth : 0),
          cy: top + maxHeight / 2,
          rx: circleSize / 2,
          ry: circleSize / 2,
        }
      })
    } else if (direction === directionType.VERTICAL) {
      this.#circleData = data.map((item, i) => ({
        cx: left + circleSize / 2,
        cy: top + maxHeight / 2 + (i ? (outer + fontSize + circleSize) * i : 0),
        rx: circleSize / 2,
        ry: circleSize / 2,
      }))
    }
    // 根据圆的数据确定文字的数据
    this.#textData = this.#circleData.map(({cx, cy}, i) => ({
      value: data[i],
      x: cx + circleSize / 2 + inner,
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
      totalWidth = circleSize + inner + max(data.map(value => getTextWidth(value, fontSize)))
      totalHeight = y - top + maxHeight
    }
    const [offsetX, offsetY] = [width - totalWidth, height - totalHeight]
    const [isHorizontalMiddle, isHorizontalEnd] = [align === alignType.MIDDLE, align === alignType.END]
    const [isVerticalMiddle, isVerticalEnd] = [verticalAlign === alignType.MIDDLE, verticalAlign === alignType.END]
    this.#circleData = this.#circleData.map(({cx, cy, ...size}) => ({
      ...size,
      cx: cx + offset[0] + (isHorizontalMiddle ? offsetX / 2 : isHorizontalEnd ? offsetX : 0),
      cy: cy + offset[1] + (isVerticalMiddle ? offsetY / 2 : isVerticalEnd ? offsetY : 0), 
    }))
    this.#textData = this.#textData.map(({x, y, value}) => ({
      value,
      x: x + offset[0] + (isHorizontalMiddle ? offsetX / 2 : isHorizontalEnd ? offsetX : 0),
      y: y + offset[1] + (isVerticalMiddle ? offsetY / 2 : isVerticalEnd ? offsetY : 0),
    }))
  }

  draw() {
    const circleData = this.#circleData.map(({rx, ry, cx, cy}, i) => ({
      data: [[rx, ry]],
      position: [[cx, cy]],
      source: [{value: this.#data[i], index: i}],
      ...this.#style.circle,
      fill: this.#colors[i],
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

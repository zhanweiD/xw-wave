import * as d3 from 'd3'
import LayerBase from '../base'
import Scale from '../../data/scale'

// 映射的图表类型
const shapeType = {
  RECT: 'rect', // 矩形
  CIRCLE: 'circle', // 圆形
}

// 默认选项
const defaultOptions = {
  shape: shapeType.DEFAULT,
}

// 默认样式
const defaultStyle = {
  circleSize: ['auto', 'auto'],
  circle: {},
  rect: {},
  text: {},
}

export default class MatrixLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #style = defaultStyle

  #rectData = []

  #circleData = []

  #textData = []

  get data() {
    return this.#data
  }

  get scale() {
    return this.#scale
  }

  get style() {
    return this.#style
  }

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['rect', 'circle', 'text'])
    const {shape} = this.options
    this.className = `wave-${shape}-matrix`
    this.tooltipTargets = ['rect', 'circle']
  }

  // 传入列表类，前两列为维度数据列
  setData(table, scales) {
    this.#data = table || this.#data
    const {shape, layout} = this.options
    const {left, top, width, height} = layout
    const [rows, columns, pureTable] = [this.#data.data[0], this.#data.data[1], this.#data.data[2]]
    // 初始化比例尺
    this.#scale = this.createScale({
      scaleX: new Scale({
        type: 'band',
        domain: columns,
        range: [0, width],
      }),
      scaleY: new Scale({
        type: 'band',
        domain: rows,
        range: [0, height],
      }),
    }, this.#scale, scales)
    // 计算基础数据
    const {scaleX, scaleY} = this.#scale
    const [bandwidthX, bandwidthY] = [scaleX.bandwidth(), scaleY.bandwidth()]
    // 根据比例尺计算原始矩形坐标和数据，原始坐标为左上角
    if (shape === shapeType.RECT) {
      this.#rectData = pureTable.map((values, i) => values.map((value, j) => ({
        value,
        dimension: `${rows[i]} ${columns[j]}`,
        x: left + scaleX(columns[j]),
        y: top + scaleY(rows[i]),
        width: bandwidthX,
        height: bandwidthY,
      })))
    }
    // 圆形数据
    if (shape === shapeType.CIRCLE) {
      this.#circleData = pureTable.map((values, i) => values.map((value, j) => ({
        value,
        dimension: `${rows[i]} ${columns[j]}`,
        cx: left + scaleX(columns[j]) + bandwidthX / 2,
        cy: top + scaleY(rows[i]) + bandwidthY / 2,
        r: Math.min(bandwidthX, bandwidthY) / 2,
      })))
    }
    // 文字数据
    this.#data.set('textData', pureTable.map((values, i) => values.map((value, j) => ({
      x: left + scaleX(columns[j]) + bandwidthX / 2,
      y: top + scaleY(rows[i]) + bandwidthY / 2,
      value,
    }))))
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {shape} = this.options
    const [minValue, maxValue] = this.#data.range()
    const {circleSize, rect, circle, text} = this.#style
    // 颜色和数值有关
    const scaleRectColor = new Scale({
      type: 'ordinal',
      domain: d3.range(0, maxValue - minValue, 1),
      range: this.getColor(maxValue - minValue + 1, rect.fill),
    })
    const scaleCircleColor = new Scale({
      type: 'ordinal',
      domain: d3.range(0, maxValue - minValue, 1),
      range: this.getColor(maxValue - minValue + 1, circle.fill),
    })
    this.#rectData.forEach(group => group.forEach(item => {
      item.color = scaleRectColor(Math.round(item.value - minValue))
    }))
    this.#circleData.forEach(group => group.forEach(item => {
      item.color = scaleCircleColor(Math.round(item.value - minValue))
    }))
    // 标签文字数据
    this.#textData = this.#data.get('textData').map(group => group.map(item => this.createText({
      ...item, style: text, position: 'center',
    })))
    // 圆形的大小随数值大小变化
    if (shape === shapeType.CIRCLE) {
      let [min, max] = circleSize
      const [bandwidthX, bandwidthY] = [this.#scale.scaleX.bandwidth(), this.#scale.scaleY.bandwidth()]
      const ceiling = Math.min(bandwidthX, bandwidthY) / 1.8
      if (max === 'auto' || max < 0) max = ceiling
      if (min === 'auto' || min < 0) min = max > ceiling ? ceiling / 2 : max / 2
      const scale = new Scale({
        type: 'linear',
        domain: this.#data.range(),
        range: [min, max],
      })
      this.#circleData.forEach(group => group.forEach(item => {
        item.r = scale(item.value)
      }))
    }
  }

  // 绘制
  draw() {
    const {shape} = this.options
    const rectData = this.#rectData.map(group => {
      const data = group.map(({width, height}) => [width, height])
      const source = group.map(({dimension, value}) => ({dimension, value}))
      const position = group.map(({x, y}) => [x, y])
      const fill = group.map(({color}) => color)
      return {data, source, position, ...this.#style.rect, fill}
    })
    const circleData = this.#circleData.map(group => {
      const data = group.map(({r}) => [r, r])
      const position = group.map(({cx, cy}) => [cx, cy])
      const source = group.map(({dimension, value}) => ({dimension, value}))
      const fill = group.map(({color}) => color)
      return {data, source, position, ...this.#style.circle, fill}
    })
    const textData = this.#textData.map(group => {
      const data = group.map(({value}) => value)
      const position = group.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    shape === shapeType.RECT && this.drawBasic('rect', rectData)
    shape === shapeType.CIRCLE && this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

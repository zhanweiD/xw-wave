import * as d3 from 'd3'
import LayerBase from './base'
import Scale from '../data/scale'

// 映射的图表类型
const modeType = {
  RECT: 'rect', // 矩形
  CIRCLE: 'circle', // 圆形
}

// 默认样式
const defaultStyle = {
  circleSize: ['auto', 'auto'],
  circle: {},
  rect: {},
  text: {},
}

// 矩形图层
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
    super(layerOptions, waveOptions, ['rect', 'circle', 'text'])
    const {mode = modeType.RECT} = this.options
    this.className = `wave-${mode}-matrix`
  }

  // 传入列表类，第一列数据要求为纬度数据列
  setData(table, scales = {}) {
    this.#data = table || this.#data
    const {mode = modeType.RECT, layout} = this.options
    const {left, top, width, height} = layout
    const [rows, columns, pureTable] = [this.#data.data[0], this.#data.data[1], this.#data.data[2]]
    const [min, max] = this.#data.range()
    // 初始化比例尺
    this.#scale.nice = {paddingInner: 0, ...this.#scale.nice, ...scales.nice}
    this.#scale = this.createScale({
      scaleX: new Scale({
        type: 'band',
        domain: columns,
        range: [0, width],
        nice: this.#scale.nice,
      }),
      scaleY: new Scale({
        type: 'band',
        domain: rows,
        range: [0, height],
        nice: this.#scale.nice,
      }),
      scaleColor: new Scale({
        type: 'ordinal',
        domain: d3.range(0, max - min, 1),
        range: this.getColor(max - min + 1, this.#style.rect?.fill || this.#style.circle?.fill, true),
      }),
    }, this.#scale, scales)
    // 计算基础数据
    const {scaleX, scaleY, scaleColor} = this.#scale
    const [bandWidthX, bandWidthY] = [scaleX.bandwidth(), scaleY.bandwidth()]
    // 根据比例尺计算原始矩形坐标和数据，原始坐标为左上角
    if (mode === modeType.RECT) {
      this.#rectData = pureTable.map((values, i) => values.map((value, j) => ({
        value,
        dimension: [rows[i], columns[j]],
        color: scaleColor(Math.round(value - min)),
        x: left + scaleX(columns[j]),
        y: top + scaleY(rows[i]),
        width: bandWidthX,
        height: bandWidthY,
      })))
    }
    // 圆形数据
    if (mode === modeType.CIRCLE) {
      this.#circleData = pureTable.map((values, i) => values.map((value, j) => ({
        value,
        dimension: [rows[i], columns[j]],
        color: scaleColor(Math.round(value - min)),
        cx: left + scaleX(columns[j]) + bandWidthX / 2,
        cy: top + scaleY(rows[i]) + bandWidthY / 2,
        rx: Math.min(bandWidthX, bandWidthY) / 2,
        ry: Math.min(bandWidthX, bandWidthY) / 2,
      })))
    }
    // 文字数据
    this.#textData = pureTable.map((values, i) => values.map((value, j) => ({
      value,
      x: left + scaleX(columns[j]) + bandWidthX / 2,
      y: top + scaleY(rows[i]) + bandWidthY / 2,
    })))
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {mode = modeType.RECT} = this.options
    // 标签文字数据
    this.#textData = this.#textData.map(groupData => groupData.map(item => this.createText({
      ...item, style: this.#style.text, position: 'center',
    })))
    // 圆形的大小随数值大小变化
    if (mode === modeType.CIRCLE) {
      const {circleSize} = this.#style
      let [min, max] = circleSize
      const [bandWidthX, bandWidthY] = [this.#scale.scaleX.bandwidth(), this.#scale.scaleY.bandwidth()]
      const ceiling = Math.min(bandWidthX, bandWidthY) / 2
      if (max === 'auto') max = ceiling
      if (min === 'auto') min = max > ceiling ? ceiling / 2 : max / 2
      const scale = new Scale({
        type: 'linear',
        domain: this.#data.range(),
        range: [min, max],
        nice: null,
      })
      this.#circleData.forEach(groupData => groupData.forEach(item => {
        item.rx = scale(item.value)
        item.ry = scale(item.value)
      }))
    }
  }

  // 绘制
  draw() {
    const {mode = modeType.RECT} = this.options
    const rectData = this.#rectData.map(groupData => {
      const data = groupData.map(({width, height}) => [width, height])
      const source = groupData.map(({dimension, value}) => ({dimension, value}))
      const position = groupData.map(({x, y}) => [x, y])
      const fill = groupData.map(({color}) => color)
      return {data, source, position, ...this.#style.rect, fill}
    })
    const circleData = this.#circleData.map(groupData => {
      const data = groupData.map(({rx, ry}) => [rx, ry])
      const position = groupData.map(({cx, cy}) => [cx, cy])
      const source = groupData.map(({dimension, value}) => ({dimension, value}))
      const fill = groupData.map(({color}) => color)
      return {data, source, position, ...this.#style.circle, fill}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    mode === modeType.RECT && this.drawBasic('rect', rectData)
    mode === modeType.CIRCLE && this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

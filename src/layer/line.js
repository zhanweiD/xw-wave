import LayerBase from './base'
import Scale from '../data/scale'

// 元素组合方式
const modeType = {
  DEFAULT: 'default',
  STACK: 'stack',
}

// 文字方向
const labelPositionType = {
  CENTER: 'center',
  TOP: 'top',
  BOTTOM: 'bottom',
  RIGHT: 'right',
  LEFT: 'left',
}

// 默认样式
const defaultStyle = {
  pointSize: 5,
  labelPosition: labelPositionType.TOP,
  text: {},
  line: {
    strokeWidth: 2,
  },
  circle: {
    fill: 'white',
    strokeWidth: 2,
  },
  area: {
    hide: true,
    opacity: 0.2,
  },
}

// 矩形图层
export default class LineLayer extends LayerBase {
  #data = null
  
  #scale = null

  #style = defaultStyle

  #lineData = []

  #textData = []

  #circleData = []

  #areaData = []

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
    super(layerOptions, waveOptions)
    const {mode = modeType.DEFAULT} = this.options
    this.className = `wave-${mode}-line`
  }

  // 传入列表类，第一列数据要求为纬度数据列
  setData(tableList) {
    this.#data = tableList || this.#data
    const {mode = modeType.DEFAULT, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    const {width, height, top, left} = layout
    // 初始化比例尺
    this.#scale = {
      scaleX: new Scale({
        type: 'point',
        domain: this.#data.select(headers[0]).data[0].list,
        range: [0, width],
      }),
      scaleY: new Scale({
        type: 'linear',
        domain: this.#data.select(headers.slice(1), {mode: mode === 'stack' && 'sum'}).range(),
        range: [height, 0],
        nice: {count: 5, zero: true},
      }),
    }
    // 计算基础数据
    const {scaleX, scaleY} = this.#scale
    this.#lineData = pureTableList.map(([dimension, ...values]) => {
      return values.map((value, i) => ({
        value,
        dimension,
        category: headers[i + 1],
        x: left + scaleX(dimension),
        y: top + (value > 0 ? scaleY(value) : scaleY(0)),
        height: height - scaleY(value),
      }))
    })
    // 堆叠柱状数据变更
    if (mode === modeType.STACK) {
      this.#lineData = this.#lineData.map(groupData => {
        return groupData.reduce((prev, cur, index) => {
          return [...prev, {
            ...cur, 
            y: prev[index].y - cur.height,
          }]
        }, [{y: groupData[0].y + groupData[0].height}]).slice(1)
      })
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {getColor, layout, mode = modeType.DEFAULT} = this.options
    const {labelPosition, labelOffset = 5, pointSize = 5} = this.#style
    const {top, height} = layout
    const {fontSize = 12, format} = this.#style.text
    // 颜色跟随主题
    const colors = getColor(this.#lineData.length)
    this.#lineData.forEach(groupData => groupData.forEach((item, i) => item.color = colors[i]))
    // 标签文字数据
    this.#textData = this.#lineData.map(groupData => groupData.map(({value, x, y}) => {
      return this.createText({x, y, value, fontSize, format, position: labelPosition, offset: labelOffset})
    }))
    // 圆点数据
    this.#circleData = this.#lineData.map(groupData => groupData.map(item => ({...item, r: pointSize / 2})))
    // 面积数据
    this.#areaData = this.#lineData.map((groupData, i) => groupData.map(({y, ...item}, j) => ({
      y0: y,
      y1: mode === modeType.STACK && j !== 0 ? this.#lineData[i][j - 1].y : height + top,
      ...item,
    })))
  }

  // 绘制
  draw() {
    const lineData = this.#lineData[0].map(({color}, index) => {
      const position = this.#lineData.map(item => [item[index].x, item[index].y])
      return {position: [position], stroke: color, ...this.#style.line}
    })
    const areaData = this.#areaData[0].map(({color}, index) => {
      const position = this.#areaData.map(item => [item[index].x, item[index].y0, item[index].y1])
      return {position: [position], fill: color, ...this.#style.area}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    const circleData = this.#circleData.map(groupData => {
      const data = groupData.map(({r}) => [r, r])
      const position = groupData.map(({x, y}) => [x, y])
      const stroke = groupData.map(({color}) => color)
      const source = groupData.map(({dimension, category, value}) => ({dimension, category, value}))
      return {data, position, source, stroke, ...this.#style.circle}
    })
    this.drawBasic('area', areaData)
    this.drawBasic('curve', lineData)
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

import {isNumber} from 'lodash'
import LayerBase from '../base'
import Scale from '../../data/scale'

// 元素组合方式
const modeType = {
  DEFAULT: 'default', // 覆盖
  STACK: 'stack', // 堆叠
}

// 数据异常处理方式
const fallbackType = {
  ZERO: 'zero', // 置为零
  CONTINUE: 'continue', // 保持连接
  BREAK: 'break', // 中断
}

// 默认选项
const defaultOptions = {
  mode: modeType.DEFAULT,
  fallback: fallbackType.BREAK,
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
  circleSize: 5,
  labelPosition: labelPositionType.TOP,
  text: {
    offset: [0, 5],
  },
  curve: {
    strokeWidth: 2,
  },
  circle: {
    fill: 'white',
    strokeWidth: 2,
  },
  area: {
    fillOpacity: 0,
  },
}

export default class LineLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #style = defaultStyle

  #curveData = []

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
    super({...defaultOptions, ...layerOptions}, waveOptions, ['curve', 'circle', 'area', 'text'])
    const {mode} = this.options
    this.className = `wave-${mode}-curve`
    this.tooltipTargets = ['circle']
  }

  // 传入列表类，第一列数据要求为维度数据列
  setData(tableList, scales) {
    this.#data = tableList || this.#data
    const {mode, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    const {width, height, top, left} = layout
    // 初始化比例尺
    this.#scale = this.createScale({
      scaleX: new Scale({
        type: 'band',
        domain: this.#data.select(headers[0]).data[0].list,
        range: [0, width],
      }),
      scaleY: new Scale({
        type: 'linear',
        domain: this.#data.select(headers.slice(1), {mode: mode === 'stack' && 'sum'}).range(),
        range: [height, 0],
      }),
    }, this.#scale, scales)
    // 计算基础数据
    const {scaleX, scaleY} = this.#scale
    this.#curveData = pureTableList.map(([dimension, ...values]) => values.map((value, i) => ({
      value,
      dimension,
      category: headers[i + 1],
      x: left + scaleX(dimension) + scaleX.bandwidth() / 2,
      y: isNumber(value) ? top + scaleY(value) : top + height,
    })))
    // 堆叠柱状数据变更
    if (mode === modeType.STACK) {
      this.#curveData.forEach(groupData => groupData.forEach((item, i) => {
        i !== 0 && (item.y = groupData[i - 1].y - (scaleY(0) + top - item.y))
      }))
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {layout, mode} = this.options
    const {labelPosition, circleSize, text, curve} = this.#style
    const {top, height} = layout
    // 颜色跟随主题
    const colors = this.getColor(this.#curveData[0].length, curve.stroke)
    this.#curveData.forEach(groupData => groupData.forEach((item, i) => item.color = colors[i]))
    // 标签文字数据
    this.#textData = this.#curveData.map(groupData => groupData.map(({value, x, y}) => {
      return this.createText({x, y, value, position: labelPosition, style: text})
    }))
    // 圆点数据
    this.#circleData = this.#curveData.map(groupData => groupData.map(item => ({...item, r: circleSize / 2})))
    // 面积数据
    this.#areaData = this.#curveData.map((groupData, i) => groupData.map(({y, ...item}, j) => ({
      y0: y,
      y1: mode === modeType.STACK && j !== 0 ? this.#curveData[i][j - 1].y : height + top,
      ...item,
    })))
    // 图层自定义图例数据
    this.#data.set('legendData', {
      list: this.#data.data.slice(1).map(({header}, i) => ({label: header, color: colors[i]})),
      shape: 'broken-line',
      filter: 'column',
    })
  }

  // 数据异常时重构数据
  #fallbackFilter = position => {
    const {scaleY} = this.#scale
    const {fallback, layout} = this.options
    if (fallback === fallbackType.BREAK) {
      return position.reduce((prev, cur) => (cur[1]
        ? [...prev.slice(0, prev.length - 1), [...prev[prev.length - 1], cur]] 
        : [...prev, []]),
      [[]])
    }
    if (fallback === fallbackType.CONTINUE) {
      return [position.filter(item => Boolean(item[1]))]
    }
    if (fallback === fallbackType.ZERO) {
      return [position.map(item => [item[0], item[1] || item[2] || scaleY(0) + layout.top, item[2]])]
    }
    return null
  }

  // 绘制
  draw() {
    const curveData = this.#curveData[0].map(({color}, index) => {
      const position = this.#curveData.map(item => [
        item[index].x, 
        isNumber(item[index].value) && item[index].y,
      ])
      return {position: this.#fallbackFilter(position), ...this.#style.curve, stroke: color}
    })
    const areaData = this.#areaData[0].map(({color}, index) => {
      const position = this.#areaData.map(item => [
        item[index].x, 
        isNumber(item[index].value) && item[index].y0, 
        item[index].y1,
      ])
      return {position: this.#fallbackFilter(position), ...this.#style.area, fill: color}
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
      return {data, position, source, ...this.#style.circle, stroke}
    })
    this.drawBasic('area', areaData)
    this.drawBasic('curve', curveData)
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

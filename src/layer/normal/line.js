import {isNumber} from 'lodash'
import LayerBase from '../base'
import Scale from '../../data/scale'

const modeType = {
  DEFAULT: 'default', // cover
  STACK: 'stack', // stack line
}

const fallbackType = {
  ZERO: 'zero', // set value as zero
  CONTINUE: 'continue', // keep connect
  BREAK: 'break', // break off
}

const defaultOptions = {
  mode: modeType.DEFAULT,
  fallback: fallbackType.BREAK,
}

const labelPositionType = {
  CENTER: 'center',
  TOP: 'top',
  BOTTOM: 'bottom',
  RIGHT: 'right',
  LEFT: 'left',
}

const defaultStyle = {
  pointSize: 5,
  labelPosition: labelPositionType.TOP,
  text: {
    offset: [0, 5],
  },
  curve: {
    strokeWidth: 2,
  },
  point: {
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

  #pointData = []

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

  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['curve', 'point', 'area', 'text'])
    const {mode} = this.options
    this.className = `wave-${mode}-curve`
    this.tooltipTargets = ['point']
  }

  setData(tableList, scales) {
    this.#data = tableList || this.#data
    const {mode, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    const {width, height, top, left} = layout
    // initialize scales
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
    // basic data of curve
    const {scaleX, scaleY} = this.#scale
    this.#curveData = pureTableList.map(([dimension, ...values]) => values.map((value, i) => ({
      value,
      dimension,
      category: headers[i + 1],
      x: left + scaleX(dimension) + scaleX.bandwidth() / 2,
      y: isNumber(value) ? top + scaleY(value) : top + height,
    })))
    // transform data to stack line
    if (mode === modeType.STACK) {
      this.#curveData.forEach(groupData => groupData.forEach((item, i) => {
        i !== 0 && (item.y = groupData[i - 1].y - (scaleY(0) + top - item.y))
      }))
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {layout, mode} = this.options
    const {labelPosition, pointSize, text, curve} = this.#style
    const {top, height} = layout
    // get the color for each line
    const colors = this.getColor(this.#curveData[0].length, curve.stroke)
    this.#curveData.forEach(groupData => groupData.forEach((item, i) => item.color = colors[i]))
    // line label
    this.#textData = this.#curveData.map(groupData => groupData.map(({value, x, y}) => {
      return this.createText({x, y, value, position: labelPosition, style: text})
    }))
    // point data
    this.#pointData = this.#curveData.map(groupData => groupData.map(item => ({...item, r: pointSize / 2})))
    // area data
    this.#areaData = this.#curveData.map((groupData, i) => groupData.map(({y, ...item}, j) => ({
      y0: y,
      y1: mode === modeType.STACK && j !== 0 ? this.#curveData[i][j - 1].y : height + top,
      ...item,
    })))
    // legend data of line layer
    this.#data.set('legendData', {
      list: this.#data.data.slice(1).map(({header}, i) => ({label: header, color: colors[i]})),
      shape: 'broken-line',
      filter: 'column',
    })
  }

  // data exception handling
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

  draw() {
    const curveData = this.#curveData[0].map(({color}, index) => {
      const data = this.#curveData.map(item => [
        item[index].x, 
        isNumber(item[index].value) && item[index].y,
      ])
      return {data: this.#fallbackFilter(data), ...this.#style.curve, stroke: color}
    })
    const areaData = this.#areaData[0].map(({color}, index) => {
      const data = this.#areaData.map(item => [
        item[index].x, 
        isNumber(item[index].value) && item[index].y0, 
        item[index].y1,
      ])
      return {data: this.#fallbackFilter(data), ...this.#style.area, fill: color}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    const pointData = this.#pointData.map(groupData => {
      const data = groupData.map(({r}) => [r, r])
      const position = groupData.map(({x, y}) => [x, y])
      const stroke = groupData.map(({color}) => color)
      const source = groupData.map(({dimension, category, value}) => ({dimension, category, value}))
      return {data, position, source, ...this.#style.point, stroke}
    })
    this.drawBasic('area', areaData)
    this.drawBasic('curve', curveData)
    this.drawBasic('circle', pointData, 'point')
    this.drawBasic('text', textData)
  }
}

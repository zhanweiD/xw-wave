import {isNumber} from 'lodash'
import chroma from 'chroma-js'
import LayerBase from '../base'
import Scale from '../../data/scale'

const MODE = {
  DEFAULT: 'default', // cover
  STACK: 'stack', // stack line
}

const FALLBACK = {
  ZERO: 'zero', // set value as zero
  CONTINUE: 'continue', // keep connect
  BREAK: 'break', // break off
}

const defaultOptions = {
  mode: MODE.DEFAULT,
  fallback: FALLBACK.BREAK,
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
    curve: false,
    strokeWidth: 2,
  },
  point: {
    fill: 'white',
    strokeWidth: 2,
  },
  area: {
    fillOpacity: 0,
  },
  unit: {
    showUnit: false,
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

  constructor(layerOptions, chartOptions) {
    super({...defaultOptions, ...layerOptions}, chartOptions, ['curve', 'point', 'area', 'text'])
    const {mode} = this.options
    this.className = `chart-${mode}-curve`
    this.tooltipTargets = ['point']
  }

  setData(tableList, scales) {
    this.#data = this.createData('tableList', this.#data, tableList)
    const {mode, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    const {width, height, top, left} = layout
    // initialize scales
    this.#scale = this.createScale(
      {
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
      },
      this.#scale,
      scales
    )
    // basic data of curve
    const {scaleX, scaleY} = this.#scale
    this.#curveData = pureTableList.map(([dimension, ...values]) => {
      return values.map((value, i) => ({
        value,
        source: {dimension, category: headers[i + 1], value},
        x: left + scaleX(dimension) + scaleX.bandwidth() / 2,
        y: isNumber(value) ? top + scaleY(value) : top + height,
      }))
    })
    // transform data to stack line
    if (mode === MODE.STACK) {
      this.#curveData.forEach(group => {
        group.forEach((item, i) => {
          i !== 0 && (item.y = group[i - 1].y - (scaleY(0) + top - item.y))
        })
      })
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {layout, mode, createGradient} = this.options
    const {labelPosition, pointSize, text, curve} = this.#style
    const {top, height} = layout
    // get the color for each line
    const colorMatrix = this.getColorMatrix(1, this.#curveData[0]?.length, curve.stroke)
    this.#curveData.forEach(group => group.forEach((item, i) => (item.color = colorMatrix.get(0, i))))
    // line label
    this.#textData = this.#curveData.map(group => {
      return group.map(({value, x, y}) => {
        return this.createText({x, y, value, position: labelPosition, style: text, offset: 5})
      })
    })
    // point data
    this.#pointData = this.#curveData.map(group => group.map(item => ({...item, r: pointSize / 2})))
    // area data
    this.#areaData = this.#curveData.map((group, i) => {
      return group.map(({y, color, ...item}, j) => ({
        y0: y,
        y1: mode === MODE.STACK && j !== 0 ? this.#curveData[i][j - 1].y : height + top,
        // TODO: refresh gradient error
        fill: !i && createGradient({type: 'linear', direction: 'vertical', colors: [color, chroma(color).alpha(0)]}),
        ...item,
      }))
    })
    // legend data of line layer
    this.#data.set('legendData', {
      colorMatrix,
      filter: 'column',
      list: this.#data.data.slice(1).map(({header}, i) => ({
        label: header,
        shape: 'broken-line',
        color: colorMatrix.get(0, i),
      })),
    })
  }

  // data exception handling
  #fallbackFilter = position => {
    const {scaleY} = this.#scale
    const {fallback, layout} = this.options
    if (fallback === FALLBACK.BREAK) {
      return position.reduce(
        (prev, cur) => (cur[1] ? [...prev.slice(0, prev.length - 1), [...prev[prev.length - 1], cur]] : [...prev, []]),
        [[]]
      )
    }
    if (fallback === FALLBACK.CONTINUE) {
      return [position.filter(item => Boolean(item[1]))]
    }
    if (fallback === FALLBACK.ZERO) {
      return [position.map(item => [item[0], item[1] || item[2] || scaleY(0) + layout.top, item[2]])]
    }
    return null
  }

  draw() {
    const curveData = this.#curveData[0].map(({color}, index) => {
      const data = this.#curveData.map(item => [item[index].x, isNumber(item[index].value) && item[index].y])
      return {data: this.#fallbackFilter(data), ...this.#style.curve, stroke: color}
    })
    const {curve} = this.#style.curve
    const areaData = this.#areaData[0].map(({fill}, index) => {
      const data = this.#areaData.map(item => [
        item[index].x,
        isNumber(item[index].value) && item[index].y0,
        item[index].y1,
      ])
      return {data: this.#fallbackFilter(data), ...this.#style.area, curve, fill}
    })
    const textData = this.#textData.map(group => ({
      data: group.map(({value}) => value),
      position: group.map(({x, y}) => [x, y]),
      ...this.#style.text,
    }))
    const pointData = this.#pointData.map(group => ({
      data: group.map(({r}) => [r, r]),
      position: group.map(({x, y}) => [x, y]),
      source: group.map(({source}) => source),
      ...this.#style.point,
      stroke: group.map(({color}) => color),
    }))

    const {unit = {}} = this.#style
    if (unit.showUnit) {
      const unitData = {
        ...unit,
        data: [unit.data],
        position: [unit.offset],
      }
      textData.push(unitData)
    }
    this.drawBasic('area', areaData)
    this.drawBasic('curve', curveData)
    this.drawBasic('circle', pointData, 'point')
    this.drawBasic('text', textData)
  }
}

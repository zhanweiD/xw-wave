import {cloneDeep, isArray, isNumber} from 'lodash'
import {formatNumber} from '../../utils/format'
import LayerBase from '../base'
import Scale from '../../data/scale'

const waveType = {
  COLUMN: 'column', // histogram
  BAR: 'bar', // bar
}

const modeType = {
  GROUP: 'group',
  STACK: 'stack',
  INTERVAL: 'interval',
  WATERFALL: 'waterfall',
  DEFAULT: 'default', // cover
  PERCENTAGE: 'percentage',
}

const defaultOptions = {
  type: waveType.COLUMN,
  mode: modeType.DEFAULT,
}

const labelPositionType = {
  CENTER: 'center',
  TOPINNER: 'top-inner',
  TOPOUTER: 'top-outer',
  RIGHTINNER: 'right-inner',
  RIGHTOUTER: 'right-outer',
  BOTTOMINNER: 'bottom-inner',
  BOTTOMOUTER: 'bottom-outer',
  LEFTINNER: 'left-inner',
  LEFTOUTER: 'left-outer',
}

const defaultStyle = {
  fixedLength: null,
  bandZoomFactor: 1,
  labelPosition: labelPositionType.CENTER,
  rect: {},
  text: {
    offset: [0, 0],
  },
  background: {
    fill: 'none',
  },
}

export default class RectLayer extends LayerBase {
  #data = null

  #scale = {}

  #style = defaultStyle

  #rectData = []

  #backgroundData = []

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

  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['rect', 'background', 'text'])
    const {type, mode} = this.options
    this.className = `wave-${mode}-${type}`
    this.tooltipTargets = ['rect']
  }

  // filter tableList
  #filter = data => {
    const {mode} = this.options
    // interval needs 3 columns
    if (mode === modeType.INTERVAL) {
      return data.select(data.data.map(({header}) => header).slice(0, 3))
    }
    // waterfall needs 2 columns and the extra sum column
    if (mode === modeType.WATERFALL) {
      const result = data.select(data.data.map(({header}) => header).slice(0, 2))
      result.push(['总和', result.select(result.data[1].header, {mode: 'sum', target: 'column'}).range()[1]])
      return result
    }
    return data
  }

  setData(tableList, scales) {
    const {type} = this.options
    this.#data = this.createData('tableList', this.#data, tableList, this.#filter)
    if (type === waveType.COLUMN) {
      this.#setColumnData(scales)
    } else if (type === waveType.BAR) {
      this.#setBarData(scales)
    }
    // change data according mode type
    this.#transform()
  }

  #setColumnData = scales => {
    const {mode, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    // initialize scales
    this.#scale = this.createScale(
      {
        scaleX: new Scale({
          type: 'band',
          domain: this.#data.select(headers[0]).data[0].list,
          range: [0, layout.width],
        }),
        scaleY: new Scale({
          type: 'linear',
          domain:
            mode === modeType.PERCENTAGE
              ? [0, 1]
              : this.#data.select(headers.slice(1), {mode: mode === 'stack' && 'sum'}).range(),
          range: [layout.height, 0],
        }),
      },
      this.#scale,
      scales
    )
    // origin data of columns
    const {scaleX, scaleY} = this.#scale
    this.#rectData = pureTableList.map(([dimension, ...values]) => values.map((value, i) => ({
      value,
      x: layout.left + scaleX(dimension),
      y: layout.top + (value > 0 ? scaleY(value) : scaleY(0)),
      width: scaleX.bandwidth(),
      height: Math.abs(scaleY(value) - scaleY(0)),
      source: {dimension, category: headers[i + 1], value},
    })))
    // rect background data
    this.#backgroundData = pureTableList.map(([dimension]) => [
      {
        x: layout.left + scaleX(dimension),
        y: layout.top,
        width: scaleX.bandwidth(),
        height: layout.height,
      },
    ])
  }

  #setBarData = scales => {
    const {mode, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    // initialize scales
    this.#scale = this.createScale(
      {
        scaleX: new Scale({
          type: 'linear',
          domain:
            mode === modeType.PERCENTAGE
              ? [0, 1]
              : this.#data.select(headers.slice(1), {mode: mode === 'stack' && 'sum'}).range(),
          range: [0, layout.width],
        }),
        scaleY: new Scale({
          type: 'band',
          domain: this.#data.select(headers[0]).data[0].list,
          range: [0, layout.height],
        }),
      },
      this.#scale,
      scales
    )
    // origin data of bars
    const {scaleX, scaleY} = this.#scale
    this.#rectData = pureTableList.map(([dimension, ...values]) => values.map((value, i) => ({
      value,
      y: layout.top + scaleY(dimension),
      x: layout.left + (value < 0 ? scaleX(value) : scaleX(0)),
      width: Math.abs(scaleX(value) - scaleX(0)),
      height: scaleY.bandwidth(),
      source: {dimension, category: headers[i + 1], value},
    })))
    // rect background data
    this.#backgroundData = pureTableList.map(([dimension]) => [
      {
        x: layout.left,
        y: layout.top + scaleY(dimension),
        width: layout.width,
        height: scaleY.bandwidth(),
      },
    ])
  }

  #transform = () => {
    let transformedData = this.#rectData
    const {type, mode, layout} = this.options
    // percentage needs the help of stacking algorithm
    if (mode === modeType.PERCENTAGE) {
      transformedData.forEach(group => {
        const total = group.reduce((prev, cur) => prev + cur.value, 0)
        const percentages = group.map(({value}) => value / total)
        group.forEach((item, i) => {
          item.percentage = formatNumber(percentages[i], {decimalPlace: 4})
          if (type === waveType.COLUMN) {
            item.y = item.y + item.height - layout.height * percentages[i]
            item.height = layout.height * percentages[i]
          } else if (type === waveType.BAR) {
            item.width = layout.width * percentages[i]
          }
        })
      })
    }
    // stacking algorithm
    if (mode === modeType.STACK || mode === modeType.PERCENTAGE) {
      if (type === waveType.COLUMN) {
        transformedData.forEach(group => group.forEach((item, i) => {
          i !== 0 && (item.y = group[i - 1].y - item.height)
        }))
      } else if (type === waveType.BAR) {
        transformedData.forEach(group => group.forEach((item, i) => {
          i !== 0 && (item.x = group[i - 1].x + group[i - 1].width)
        }))
      }
    }
    // grouping algorithm
    if (mode === modeType.GROUP) {
      const columnNumber = transformedData[0].length
      if (type === waveType.COLUMN) {
        transformedData.forEach(group => group.forEach((item, i) => {
          item.width /= columnNumber
          i !== 0 && (item.x = group[i - 1].x + group[i - 1].width)
        }))
      } else if (type === waveType.BAR) {
        transformedData.forEach(group => group.forEach((item, i) => {
          item.height /= columnNumber
          i !== 0 && (item.y = group[i - 1].y + group[i - 1].height)
        }))
      }
    }
    // interval algorithm
    if (mode === modeType.INTERVAL) {
      transformedData = transformedData.map(group => {
        const [data1, data2] = [group[0], group[1]]
        const [min, max] = [Math.min(data1.value, data2.value), Math.max(data1.value, data2.value)]
        if (type === waveType.COLUMN) {
          const y = Math.min(data1.y, data2.y)
          const height = Math.abs(data1.y - data2.y)
          return [{...data1, y, height, value: max - min, source: group.map(({source}) => source)}]
        }
        if (type === waveType.BAR) {
          const x = Math.min(data1.x + data1.width, data2.x + data2.width)
          const width = Math.abs(data1.x + data1.width - data2.x - data2.width)
          return [{...data1, x, width, value: max - min, source: group.map(({source}) => source)}]
        }
        return group
      })
    }
    // interval algorithm
    if (mode === modeType.WATERFALL) {
      if (type === waveType.COLUMN) {
        transformedData.forEach((group, i) => group.forEach(item => {
          i !== 0 && (item.y = transformedData[i - 1][0].y - item.height)
        }))
        // the last column needs special treatment
        const {y, height} = transformedData[transformedData.length - 1][0]
        transformedData[transformedData.length - 1][0].y = y + height
      } else if (type === waveType.BAR) {
        transformedData.forEach((group, i) => group.forEach(item => {
          i !== 0 && (item.x = transformedData[i - 1][0].x + transformedData[i - 1][0].width)
        }))
        // the last column needs special treatment
        const {x, width} = transformedData[transformedData.length - 1][0]
        transformedData[transformedData.length - 1][0].x = x - width
      }
    }
    this.#rectData = transformedData
  }

  #getLabelData = ({x, y, width, height, value, labelPosition}) => {
    const {type} = this.options
    const text = cloneDeep(this.#style.text)
    // reverse label when value is negative
    if (value < 0) {
      text.offset = [
        type === waveType.COLUMN ? text.offset[0] : -text.offset[0],
        type === waveType.BAR ? text.offset[1] : -text.offset[1],
      ]
    }
    // figure out label position data
    let [position, positionX, positionY] = [null, null, null]
    if (labelPosition === labelPositionType.LEFTOUTER || labelPosition === labelPositionType.LEFTINNER) {
      [positionX, positionY] = [x, y + height / 2]
      position = labelPosition === labelPositionType.LEFTOUTER ? 'left' : 'right'
    } else if (labelPosition === labelPositionType.RIGHTOUTER || labelPosition === labelPositionType.RIGHTINNER) {
      [positionX, positionY] = [x + width, y + height / 2]
      position = labelPosition === labelPositionType.RIGHTOUTER ? 'right' : 'left'
    } else if (labelPosition === labelPositionType.TOPOUTER || labelPosition === labelPositionType.TOPINNER) {
      [positionX, positionY] = [x + width / 2, y]
      position = labelPosition === labelPositionType.TOPOUTER ? 'top' : 'bottom'
    } else if (labelPosition === labelPositionType.BOTTOMOUTER || labelPosition === labelPositionType.BOTTOMINNER) {
      [positionX, positionY] = [x + width / 2, y + height]
      position = labelPosition === labelPositionType.BOTTOMOUTER ? 'bottom' : 'top'
    } else if (labelPosition === labelPositionType.CENTER) {
      [positionX, positionY] = [x + width / 2, y + height / 2]
      position = 'center'
    }
    return this.createText({x: positionX, y: positionY, value, style: text, position, offset: 5})
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {labelPosition, bandZoomFactor, fixedLength, rect} = this.#style
    const {type, mode} = this.options
    // get colors
    let colorMatrix
    if (this.#rectData[0]?.length > 1) {
      colorMatrix = this.getColorMatrix(1, this.#rectData[0]?.length, rect.fill)
      this.#rectData.forEach(group => group.forEach((item, i) => (item.color = colorMatrix.get(0, i))))
    } else if (this.#rectData[0]?.length === 1) {
      colorMatrix = this.getColorMatrix(this.#rectData.length, 1, rect.fill)
      this.#rectData.forEach((group, i) => (group[0].color = colorMatrix.get(i, 0)))
    }
    // horizontal scaling ratio
    this.#rectData = this.#rectData.map(group => group.map(({x, y, width, height, ...other}) => {
      const totalPadding = (1 - bandZoomFactor) * (type === waveType.COLUMN ? width : height)
      return {
        x: type === waveType.COLUMN ? x + totalPadding / 2 : x,
        y: type === waveType.BAR ? y + totalPadding / 2 : y,
        width: type === waveType.COLUMN ? width - totalPadding : width,
        height: type === waveType.BAR ? height - totalPadding : height,
        ...other,
      }
    }))
    // fixed rect length usually be used as mark
    if (isNumber(fixedLength)) {
      this.#rectData.forEach(group => group.forEach(item => {
        if (type === waveType.COLUMN) {
          if (item.value < 0) item.y += item.height - fixedLength
          item.height = fixedLength
        } else if (type === waveType.BAR) {
          if (item.value > 0) item.x = item.x + item.width - fixedLength
          item.width = fixedLength
        }
      }))
    }
    // label data
    this.#textData = this.#rectData.map(group => {
      const result = []
      const positionMin = isArray(labelPosition) ? labelPosition[0] : labelPosition
      const positionMax = isArray(labelPosition) ? labelPosition[1] : labelPosition
      group.forEach(({value, percentage, ...data}) => result.push(
        this.#getLabelData({
          ...data,
          value: percentage || value, // compatible percentage mode
          labelPosition: value > 0 ? positionMax : positionMin,
        })
      ))
      return result
    })
    // legend data of rect layer
    if (mode !== modeType.INTERVAL && mode !== modeType.WATERFALL) {
      this.#data.set('legendData', {
        colorMatrix,
        list: this.#data.data.slice(1).map(({header}, i) => ({label: header, color: colorMatrix.get(0, i)})),
        filter: 'column',
        shape: 'rect',
      })
    }
  }

  draw() {
    const {type} = this.options
    const rectData = this.#rectData.map(group => {
      const data = group.map(({width, height}) => [width, height])
      const source = group.map(item => item.source)
      const position = group.map(({x, y}) => [x, y])
      const fill = group.map(({color}) => color)
      const transformOrigin = type === waveType.COLUMN ? 'bottom' : 'left'
      return {data, source, position, transformOrigin, ...this.#style.rect, fill}
    })
    const background = this.#backgroundData.map(group => {
      const data = group.map(({width, height}) => [width, height])
      const position = group.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.background}
    })
    const textData = this.#textData.map(group => {
      const data = group.map(({value}) => value)
      const position = group.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('rect', background, 'background')
    this.drawBasic('rect', rectData)
    this.drawBasic('text', textData)
  }
}

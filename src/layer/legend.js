import {sum, max, range} from 'd3'
import {cloneDeep} from 'lodash'
import LayerBase from './base'
import getTextWidth from '../utils/text-width'
import {formatNumber} from '../utils/format'
import TableList from '../data/table-list'
import DataBase from '../data/base'
import AxisLayer from './axis'

const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

const directionType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

const shapeType = {
  RECT: 'rect',
  CIRCLE: 'circle',
  BROKENLINE: 'broken-line',
  DOTTEDLINE: 'dotted-line',
}

const defaultStyle = {
  align: alignType.END,
  verticalAlign: alignType.START,
  direction: directionType.HORIZONTAL,
  offset: [0, 0],
  gap: [0, 0],
  shapeSize: 12,
  shape: {},
  text: {
    fontSize: 12,
  },
}

export default class LegendLayer extends LayerBase {
  #data = {
    // origin data
    text: [],
    shape: [],
    textColors: [],
    shapeColors: [],
    // draw data
    textData: [],
    rectData: [],
    circleData: [],
    lineData: [],
    // interactive mask
    interactiveData: [],
  } 

  #layers = []

  #isFiltering = false

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['text', 'circle', 'rect', 'interactive', 'line'])
    this.className = 'wave-legend'
  }

  #filter = layers => {
    // backup data
    const colors = cloneDeep(this.#data.shapeColors)
    const originData = cloneDeep(layers.map(layer => layer.data))
    const counts = layers.map(({data}) => data.get('legendData')?.list.length)
    const filterTypes = layers.map(({data}) => data.get('legendData')?.filter)
    const active = new Array(this.#data.shapeColors.length).fill(true)
    const disableColor = '#E2E3E588'
    // register filter handler
    this.event.onWithOff('click-interactive', object => {
      const {index} = object.data.source
      const layerIndex = counts.findIndex((v, i) => sum(counts.slice(0, i + 1)) > index)
      const startIndex = counts.slice(0, layerIndex).reduce((prev, cur) => prev + cur, 0)
      const data = originData[layerIndex]
      const layer = layers[layerIndex]
      // layer needs specify the filter type
      if (!filterTypes[layerIndex]) return
      // update legend status
      if (!active[index]) {
        active[index] = true
        this.#data.shapeColors[index] = colors[index]
        this.#data.textColors[index] = this.#style.text.fill || 'white'
      } else {
        active[index] = false
        this.#data.shapeColors[index] = disableColor
        this.#data.textColors[index] = disableColor
      }
      try {
        // isFiltering means redraw caused by legend event
        this.#isFiltering = true
        let filteredData = data
        // filter rows by value of first column
        if (filterTypes[layerIndex] === 'row') {
          const order = {type: 'row', mapping: {}}
          const mapping = range(startIndex, startIndex + counts[layerIndex]).map(i => active[i])
          filteredData = data.select(data.data.map(({header}) => header))
          filteredData.data.forEach(item => item.list = item.list.filter((v, j) => mapping[j]))
          data.data[0].list.forEach((dimension, i) => order.mapping[dimension] = i)
          filteredData.options.order = order
        }
        // filter columns by value of first row
        if (filterTypes[layerIndex] === 'column') {
          const order = {type: 'column', mapping: {}}
          const subData = data.data.filter((v, i) => (!i || active[startIndex + i - 1]))
          filteredData = data.select(subData.map(({header}) => header))
          data.data.slice(1).map(({header}) => header).forEach((header, i) => order.mapping[header] = i)
          filteredData.options.order = order
        }
        // update layer
        layer.setData(filteredData)
        layer.setStyle()
        layer.draw()
        // update legend layer
        this.setStyle()
        this.draw()
      } catch (error) {
        this.log.warn('Legend Data filtering error', error)
      }
    })
  }

  /**
   * set legend data after other layers has been initialized
   * @param {Array<LayerBase>} layers
   */
  setData(layers) {
    this.#isFiltering = false
    this.#layers = layers || this.#layers
    // initialize
    this.#data.text = []
    this.#data.shape = []
    this.#data.textColors = []
    this.#data.shapeColors = []
    // layer custom legend data
    this.#layers.forEach(layer => {
      if (layer.data instanceof DataBase && layer.data.get('legendData')) {
        const {shape, list} = layer.data.get('legendData')
        this.#data.shape.push(...new Array(list.length).fill(shape))
        this.#data.text.push(...list.map(({label}) => label))
        this.#data.shapeColors.push(...list.map(({color}) => color))
        this.#data.textColors.push(...new Array(list.length).fill('white'))
      } 
    })
    // legend layer changes with other layer changed
    if (this.#layers) {
      const axisLayer = this.#layers.find(layer => layer instanceof AxisLayer)
      this.#filter(this.#layers.filter(layer => layer.data instanceof TableList))
      axisLayer?.event.onWithOff('draw', 'legend', () => {
        if (!this.#isFiltering) {
          this.setData()
          this.setStyle()
          this.draw()
        }
      })
    }
  }

  // position is the midpoint on the left side of the text
  #createShape = ({shape, x, y, size, color}) => {
    if (shape === shapeType.RECT) {
      this.#data.rectData.push({
        x: x - size * 2,
        y: y - size / 2,
        width: size * 2,
        height: size,
        fill: color,
      })
    } else if (shape === shapeType.CIRCLE) {
      this.#data.circleData.push({
        cx: x - size / 2,
        cy: y,
        r: size / 2,
        fill: color,
      })
    } else if (shape === shapeType.BROKENLINE) {
      this.#data.lineData.push({
        x1: x - size * 2,
        x2: x - (size / 2) * 3,
        y1: y,
        y2: y,
        strokeWidth: size / 5,
        stroke: color,
      }, {
        x1: x - size / 2,
        x2: x,
        y1: y,
        y2: y,
        strokeWidth: size / 5,
        stroke: color,
      })
      this.#data.circleData.push({
        cx: x - size,
        cy: y,
        r: size / 3,
        strokeWidth: size / 5,
        stroke: color,
      })
    } else if (shape === shapeType.DOTTEDLINE) {
      this.#data.lineData.push({
        x1: x - size * 2,
        x2: x,
        y1: y,
        y2: y,
        stroke: color,
        strokeWidth: size / 5,
        dasharray: `${size / 4} ${size / 4}`,
      })
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {align, verticalAlign, direction, shapeSize, offset, gap} = this.#style
    const {left, top, width, height} = this.options.layout
    const {fontSize, format} = this.#style.text
    const [inner, outer] = gap
    const maxHeight = max([shapeSize, fontSize])
    const shapeWidth = shapeSize * 2
    // initialize
    this.#data.rectData = []
    this.#data.circleData = []
    this.#data.lineData = []
    this.#data.textData = []
    // calculate text data considering the shape area
    const textData = this.#data.text.map(value => formatNumber(value, format))
    const textWidths = textData.map(value => getTextWidth(value, fontSize))
    if (direction === directionType.HORIZONTAL) {
      this.#data.textData = textData.map((value, i) => this.createText({
        x: left + (shapeWidth + inner) * (i + 1) + outer * i + sum(textWidths.slice(0, i)),
        y: top + maxHeight / 2,
        style: this.#style.text,
        position: 'right',
        value,
      }))
    } else if (direction === directionType.VERTICAL) {
      this.#data.textData = textData.map((value, i) => this.createText({
        x: left + shapeWidth + inner,
        y: top + maxHeight / 2 + maxHeight * i + outer * i,
        style: this.#style.text,
        position: 'right',
        value,
      }))
    }
    // move text data by align type
    let [totalWidth, totalHeight] = [0, 0]
    if (direction === directionType.HORIZONTAL) {
      const {x, value} = this.#data.textData[this.#data.textData.length - 1]
      totalWidth = x - left + getTextWidth(value, fontSize)
      totalHeight = maxHeight
    } else if (direction === directionType.VERTICAL) {
      const {y} = this.#data.textData[this.#data.textData.length - 1]
      totalWidth = shapeWidth + inner + max(textWidths)
      totalHeight = y - fontSize / 2 + maxHeight / 2 - top
    }
    const [offsetX, offsetY] = [width - totalWidth, height - totalHeight]
    const [isHorizontalMiddle, isHorizontalEnd] = [align === alignType.MIDDLE, align === alignType.END]
    const [isVerticalMiddle, isVerticalEnd] = [verticalAlign === alignType.MIDDLE, verticalAlign === alignType.END]
    this.#data.textData = this.#data.textData.map(({x, y, value}) => ({
      x: x + offset[0] + (isHorizontalMiddle ? offsetX / 2 : isHorizontalEnd ? offsetX : 0),
      y: y + offset[1] + (isVerticalMiddle ? offsetY / 2 : isVerticalEnd ? offsetY : 0),
      value,
    }))
    // shapes are fixed at the left of text
    this.#data.shape.forEach((value, i) => this.#createShape({
      shape: value,
      size: shapeSize,
      x: this.#data.textData[i].x - inner,
      y: this.#data.textData[i].y - fontSize / 2,
      color: this.#data.shapeColors[i],
    }))
    // generate clickable area
    this.#data.interactiveData = this.#data.textData.map(({x, y, value}, i) => ({
      x: x - shapeWidth - inner,
      y: y - fontSize / 2 - maxHeight / 2,
      width: shapeWidth + inner + textWidths[i],
      height: maxHeight,
      source: {value, index: i},
    }))
  }

  draw() {
    const rectData = [{
      data: this.#data.rectData.map(({width, height}) => [width, height]),
      position: this.#data.rectData.map(({x, y}) => [x, y]),
      ...this.#style.shape,
      fill: this.#data.rectData.map(({fill}) => fill),
    }]
    const interactiveData = [{
      data: this.#data.interactiveData.map(({width, height}) => [width, height]),
      position: this.#data.interactiveData.map(({x, y}) => [x, y]),
      source: this.#data.interactiveData.map(({source}) => source),
      fillOpacity: 0,
    }]
    const circleData = [{
      data: this.#data.circleData.map(({r}) => [r, r]),
      position: this.#data.circleData.map(({cx, cy}) => [cx, cy]),
      strokeWidth: this.#data.circleData.map(({strokeWidth}) => strokeWidth),
      ...this.#style.shape,
      fill: this.#data.circleData.map(({fill}) => fill),
      stroke: this.#data.circleData.map(({stroke}) => stroke),
    }]
    const lineData = [{
      data: this.#data.lineData.map(({x1, x2, y1, y2}) => [x1, y1, x2, y2]),
      strokeWidth: this.#data.lineData.map(({strokeWidth}) => strokeWidth),
      dasharray: this.#data.lineData.map(({dasharray}) => dasharray),
      ...this.#style.shape,
      stroke: this.#data.lineData.map(({stroke}) => stroke),
    }]
    const textData = this.#data.textData.map(({value, x, y}, i) => ({
      data: [value],
      position: [[x, y]],
      fill: this.#data.textColors[i],
      ...this.#style.text,
    }))
    this.drawBasic('rect', rectData)
    this.drawBasic('circle', circleData)
    this.drawBasic('line', lineData)
    this.drawBasic('text', textData)
    this.drawBasic('rect', interactiveData, 'interactive')
  }
}

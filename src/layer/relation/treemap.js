import * as d3 from 'd3'
import LayerBase from '../base'
import {overflowControl} from '../../utils/format'
import {ALIGNMENT} from '../../utils/constants'

// built-in tile method in d3
const TILE = {
  BINARY: 'treemapBinary', // balanced binary tree
  DICE: 'treemapDice', // horizontal division
  SLICE: 'treemapSlice', // vertical division
  SLICEDICE: 'treemapSliceDice', // odd vertical & even horizontal
  SQUARIFY: 'treemapSquarify', // maintain aspect ratio
}

const defaultOptions = {
  tile: TILE.SQUARIFY,
}

const defaultStyle = {
  align: ALIGNMENT.MIDDLE,
  verticalAlign: ALIGNMENT.MIDDLE,
  labelGap: 5,
  rect: {},
  text: {
    fontSize: 12,
  },
}

export default class TreemapLayer extends LayerBase {
  #data = null

  #rectData = []

  #textData = []

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, chartOptions) {
    super({...defaultOptions, ...layerOptions}, chartOptions, ['rect', 'text', 'gradient'])
    const {mode} = this.options
    this.className = `chart-${mode}-treemap`
    this.tooltipTargets = ['rect']
  }

  setData(relation) {
    this.#data = this.createData('relation', this.#data, relation)
    const {nodes} = this.#data.data
    const {tile, layout} = this.options
    const {left, top, width, height} = layout
    const root = {name: 'root', children: nodes.filter(({level}) => level === 0)}
    const treemap = d3.treemap().tile(d3[tile]).size([width, height]).round(true).paddingInner(1)
    const leaves = treemap(
      d3
        .hierarchy(root)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value)
    ).leaves()
    this.#rectData = leaves.map(({x0, x1, y0, y1, data}) => ({
      x: x0 + left,
      y: y0 + top,
      width: x1 - x0,
      height: y1 - y0,
      name: data.name,
      value: data.value,
    }))
  }

  setStyle(style) {
    const {type, id} = this.options
    this.#style = this.createStyle(defaultStyle, this.#style, style, id, 'column')

    const {align, verticalAlign, labelGap, text, colorList} = this.#style
    // get colors
    const colorMatrix = this.getColorMatrix(this.#rectData.length, 1, colorList)
    this.#rectData.forEach((item, i) => (item.color = colorMatrix.get(i, 0)))
    // basic text data including label and value
    this.#textData = this.#rectData.map(({x, y, width, height, value, name}) => {
      let [nameX, nameY, position] = [null, null, null]
      if (align === ALIGNMENT.START && verticalAlign === ALIGNMENT.START) {
        [nameX, nameY, position] = [x, y, 'right-bottom']
      } else if (align === ALIGNMENT.MIDDLE && verticalAlign === ALIGNMENT.START) {
        [nameX, nameY, position] = [x + width / 2, y, 'bottom']
      } else if (align === ALIGNMENT.END && verticalAlign === ALIGNMENT.START) {
        [nameX, nameY, position] = [x + width, y, 'left-bottom']
      } else if (align === ALIGNMENT.START && verticalAlign === ALIGNMENT.MIDDLE) {
        [nameX, nameY, position] = [x, y + height / 2 - labelGap / 2, 'right-top']
      } else if (align === ALIGNMENT.MIDDLE && verticalAlign === ALIGNMENT.MIDDLE) {
        [nameX, nameY, position] = [x + width / 2, y + height / 2 - labelGap / 2, 'top']
      } else if (align === ALIGNMENT.END && verticalAlign === ALIGNMENT.MIDDLE) {
        [nameX, nameY, position] = [x + width, y + height / 2 - labelGap / 2, 'left-top']
      } else if (align === ALIGNMENT.START && verticalAlign === ALIGNMENT.END) {
        [nameX, nameY, position] = [x, y + height - text.fontSize - labelGap, 'right-top']
      } else if (align === ALIGNMENT.MIDDLE && verticalAlign === ALIGNMENT.END) {
        [nameX, nameY, position] = [x + width / 2, y + height - text.fontSize - labelGap, 'top']
      } else if (align === ALIGNMENT.END && verticalAlign === ALIGNMENT.END) {
        [nameX, nameY, position] = [x + width, y + height - text.fontSize - labelGap, 'left-top']
      }
      // handle overflow text
      const nameText = overflowControl(name, {width, height: (height - labelGap) / 2})
      const valueText = overflowControl(value, {width, height: (height - labelGap) / 2})
      // return label text and value text
      return [
        this.createText({value: nameText, x: nameX, y: nameY, position, style: text}),
        this.createText({value: valueText, x: nameX, y: nameY + text.fontSize + labelGap, position, style: text}),
      ]
    })
  }

  draw() {
    const {colorList} = this.#style
    const rectData = {
      data: this.#rectData.map(({width, height}) => [width, height]),
      source: this.#rectData.map(({dimension, name, value}) => ({dimension, category: name, value})),
      position: this.#rectData.map(({x, y}) => [x, y]),
      ...this.#style.rect,
      fill: this.#rectData.map((group, index) => {
        return colorList ? this.setFill(group, index, colorList) : group.color
      }),
    }
    const textData = this.#textData.map(group => ({
      data: group.map(({value}) => value),
      position: group.map(({x, y}) => [x, y]),
      ...this.#style.text,
    }))
    this.drawBasic('rect', [rectData])
    this.drawBasic('text', textData)
  }
}

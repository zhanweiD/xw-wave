import * as d3 from 'd3'
import {sum} from 'lodash'
import LayerBase from '../base'
import Scale from '../../data/scale'
import {getAttr, range} from '../../utils/common'
import {ALIGNMENT, DIRECTION} from '../../utils/constants'

const defaultOptions = {
  type: DIRECTION.HORIZONTAL,
}

const defaultStyle = {
  nodeWidth: 10,
  nodeGap: 10,
  ribbonGap: 0,
  labelOffset: 5,
  align: ALIGNMENT.START,
  rect: {},
  ribbon: {
    fillOpacity: 0.7,
    strokeOpacity: 0,
  },
  text: {
    fontSize: 12,
  },
}

export default class SankeyLayer extends LayerBase {
  #data = null

  #scale = {}

  #rectData = []

  #ribbonData = []

  #textData = []

  #style = defaultStyle

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
    super({...defaultOptions, ...layerOptions}, chartOptions, ['rect', 'ribbon', 'text'])
    const {type} = this.options
    this.className = `chart-${type}-sankey`
    this.tooltipTargets = ['rect']
  }

  setData(relation, scales) {
    this.#data = this.createData('relation', this.#data, relation)
    const {nodes} = this.#data.data
    const {type, layout} = this.options
    const {width, height} = layout
    const levels = d3.range(0, d3.max(nodes.map(({level}) => level)) + 1)
    this.#scale = this.createScale(
      {
        scaleY: new Scale({
          type: 'linear',
          domain: [0, 1],
          range: type === DIRECTION.HORIZONTAL ? [0, height] : [0, width],
        }),
      },
      this.#scale,
      scales
    )
    // group data according the level
    this.#data.set('levels', levels)
    this.#data.set(
      'groups',
      levels.map(value => nodes.filter(({level}) => level === value))
    )
  }

  // ribbon path data
  #getPath = data => {
    const {type} = this.options
    const [x1, y1, x2, y2, x3, y3, x4, y4] = data
    if (type === DIRECTION.HORIZONTAL) {
      return [
        `M ${x1},${y1}`,
        `C ${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`,
        `L ${x3},${y3}`,
        `C ${(x3 + x4) / 2},${y3} ${(x3 + x4) / 2},${y4} ${x4},${y4} Z`,
      ].join(' ')
    }
    if (type === DIRECTION.VERTICAL) {
      return [
        `M ${x1},${y1}`,
        `C ${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`,
        `L ${x3},${y3}`,
        `C ${x3},${(y3 + y4) / 2} ${x4},${(y3 + y4) / 2} ${x4},${y4} Z`,
      ].join(' ')
    }
    return null
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {links} = this.#data.data
    const {type, layout, createGradient} = this.options
    const {labelOffset, nodeWidth, nodeGap, ribbonGap, align, text, rect, rangeColorList} = this.#style
    const [levels, groups] = [this.#data.get('levels'), this.#data.get('groups')]
    // Calculate the theoretical maximum value including the gap
    const maxNumbers = levels.map((level, i) => {
      const totalNumber = d3.sum(groups[level].map(({value}) => value))
      const gapLength = (groups[level].length - 1) * getAttr(nodeGap, i, 5)
      const totalLength = type === DIRECTION.HORIZONTAL ? layout.height : layout.width
      const ratio = totalNumber / (totalLength - gapLength)
      return totalNumber + gapLength * ratio
    })
    // update scales
    this.#scale.scaleY.domain([0, d3.max(maxNumbers)])
    const {scaleY} = this.#scale
    // basic rect data
    const totalLength = type === DIRECTION.HORIZONTAL ? layout.width : layout.height
    const groupNodeWiths = range(0, groups.length - 1).map(i => getAttr(nodeWidth, i, 5))
    const groupNodeGap = (totalLength - sum(groupNodeWiths)) / (groups.length - 1)
    this.#rectData = groups.map((groupedNodes, i) => {
      const colorMatrix = this.getColorMatrix(groupedNodes.length, 1, rangeColorList || rect.fill)
      return groupedNodes.map((item, j) => ({
        y: layout.top,
        x: layout.left + groupNodeGap * i + sum(groupNodeWiths.slice(0, i)),
        width: groupNodeWiths[i],
        height: scaleY(item.value),
        color: colorMatrix.get(j, 0),
        // this attribute is used to calculate the with of left and right side overlay
        ribbonLength: [0, 0],
        ...item,
      }))
    })
    // stacked rect data
    this.#rectData.forEach((group, i) => {
      group.forEach((item, j) => {
        j && (item.y = group[j - 1].y + group[j - 1].height + getAttr(nodeGap, i, 5))
      })
    })
    // move rect node according align value
    this.#rectData.forEach(group => {
      const tailNode = group[group.length - 1]
      if (type === DIRECTION.HORIZONTAL) {
        const offset = layout.top + layout.height - tailNode.y - tailNode.height
        const moveY = align === ALIGNMENT.END ? offset : align === ALIGNMENT.MIDDLE ? offset / 2 : 0
        group.forEach(item => (item.y += moveY))
      } else if (type === DIRECTION.VERTICAL) {
        const offset = layout.top + layout.width - tailNode.y - tailNode.height
        const moveX = align === ALIGNMENT.END ? offset : align === ALIGNMENT.MIDDLE ? offset / 2 : 0
        group.forEach(item => (item.y += moveX))
      }
    })
    // ribbon data
    const rects = this.#rectData.reduce((prev, cur) => [...prev, ...cur])
    this.#ribbonData = links.map(({from, to, value}) => {
      const length = scaleY(value)
      const fromNode = rects.find(({id}) => id === from)
      const toNode = rects.find(({id}) => id === to)
      fromNode.ribbonLength[1] += length
      toNode.ribbonLength[0] += length
      return {
        from: fromNode,
        to: toNode,
        x1: fromNode.x + fromNode.width + ribbonGap,
        y1: fromNode.y + fromNode.ribbonLength[1] - length,
        x2: fromNode.x + fromNode.width + ribbonGap,
        y2: fromNode.y + fromNode.ribbonLength[1],
        x3: toNode.x - ribbonGap,
        y3: toNode.y + toNode.ribbonLength[0] - length,
        x4: toNode.x - ribbonGap,
        y4: toNode.y + toNode.ribbonLength[0],
        color: createGradient({type: 'linear', direction: type, colors: [fromNode.color, toNode.color]}),
      }
    })
    // horizontal => vertical
    if (type === DIRECTION.VERTICAL) {
      this.#rectData = this.#rectData.map(group => {
        return group.map(({x, y, height, width, ...other}) => ({
          width: height,
          height: width,
          x: y - layout.top + layout.left,
          y: x - layout.left + layout.top,
          ...other,
        }))
      })
      this.#ribbonData = this.#ribbonData.map(({x1, y1, x2, y2, x3, y3, x4, y4, ...other}) => ({
        ...other,
        x1: y1 - layout.top + layout.left,
        y1: x1 - layout.left + layout.top,
        x2: y2 - layout.top + layout.left,
        y2: x2 - layout.left + layout.top,
        x3: y3 - layout.top + layout.left,
        y3: x3 - layout.left + layout.top,
        x4: y4 - layout.top + layout.left,
        y4: x4 - layout.left + layout.top,
      }))
    }
    // label data
    this.#textData = this.#rectData.map((group, i) => {
      const isLast = i === this.#rectData.length - 1
      if (type === DIRECTION.HORIZONTAL) {
        return group.map(({x, y, width, height, name, value}) => {
          return this.createText({
            x: isLast ? x - labelOffset : x + width + labelOffset,
            y: y + height / 2,
            value: `${name}(${value})`,
            position: isLast ? 'left' : 'right',
            style: text,
          })
        })
      }
      if (type === DIRECTION.VERTICAL) {
        return group.map(({x, y, width, height, name, value}) => {
          return this.createText({
            x: x + width / 2,
            y: isLast ? y - labelOffset : y + height + labelOffset,
            value: `${name}(${value})`,
            position: isLast ? 'top' : 'bottom',
            style: text,
          })
        })
      }
      return null
    })
  }

  draw() {
    const rectData = this.#rectData.map(group => ({
      data: group.map(({width, height}) => [width, height]),
      source: group.map(({dimension, name, value}) => ({dimension, category: name, value})),
      position: group.map(({x, y}) => [x, y]),
      transformOrigin: 'center',
      ...this.#style.rect,
      fill: group.map(({color}) => color),
    }))
    const ribbonData = this.#ribbonData.map(({x1, y1, x2, y2, x3, y3, x4, y4, color}) => ({
      data: [this.#getPath([x1, y1, x3, y3, x4, y4, x2, y2])],
      ...this.#style.ribbon,
      fill: color,
    }))
    const textData = this.#textData.map(group => ({
      data: group.map(({value}) => value),
      position: group.map(({x, y}) => [x, y]),
      ...this.#style.text,
    }))
    this.drawBasic('rect', rectData)
    this.drawBasic('path', ribbonData, 'ribbon')
    this.drawBasic('text', textData)
  }
}

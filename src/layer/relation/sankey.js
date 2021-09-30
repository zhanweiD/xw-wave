import * as d3 from 'd3'
import LayerBase from '../base'
import Scale from '../../data/scale'

const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

const directionType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

const defaultOptions = {
  type: directionType.HORIZONTAL,
}

const defaultStyle = {
  nodeWidth: 5,
  nodeGap: 5,
  ribbonGap: 0,
  labelOffset: 5,
  align: alignType.START,
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

  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['rect', 'ribbon', 'text'])
    const {type} = this.options
    this.className = `wave-${type}-sankey`
    this.tooltipTargets = ['rect']
    // delete gradient created for area
    this.event.onWithOff('before:setStyle', 'areaFill', () => {
      this.#ribbonData.forEach(({color}) => {
        document.getElementById(color.split(/[#)]/)[1]).remove()
      })
    })
  }

  setData(relation, scales) {
    this.#data = relation || this.#data
    const {nodes} = this.#data.data
    const {type, layout} = this.options
    const {width, height} = layout
    const levels = d3.range(0, d3.max(nodes.map(({level}) => level)) + 1)
    this.#scale = this.createScale(
      {
        scaleX: new Scale({
          type: 'band',
          domain: levels,
          range: type === directionType.HORIZONTAL ? [0, width] : [0, height],
          nice: scales?.nice,
        }),
        scaleY: new Scale({
          type: 'linear',
          domain: [0, 1],
          range: type === directionType.HORIZONTAL ? [0, height] : [0, width],
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
    if (type === 'horizontal') {
      return [
        `M ${x1},${y1}`,
        `C ${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`,
        `L ${x3},${y3}`,
        `C ${(x3 + x4) / 2},${y3} ${(x3 + x4) / 2},${y4} ${x4},${y4} Z`,
      ].join(' ')
    }
    if (type === 'vertical') {
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
    const {labelOffset, nodeGap, ribbonGap, align, text, rect} = this.#style
    const isHorizontal = type === directionType.HORIZONTAL
    const [levels, groups] = [this.#data.get('levels'), this.#data.get('groups')]
    // Calculate the theoretical maximum value including the gap
    const maxNumbers = levels.map(level => {
      const totalNumber = d3.sum(groups[level].map(({value}) => value))
      const gapLength = (groups[level].length - 1) * nodeGap
      const ratio = totalNumber / ((isHorizontal ? layout.height : layout.width) - gapLength)
      return totalNumber + gapLength * ratio
    })
    // update scales
    this.#scale.scaleY.domain([0, d3.max(maxNumbers)])
    const {scaleX, scaleY} = this.#scale
    // basic rect data
    this.#rectData = groups.map(groupedNodes => {
      const colorMatrix = this.getColorMatrix(groupedNodes.length, 1, rect.fill)
      return groupedNodes.map((item, i) => ({
        y: layout.top,
        x: layout.left + scaleX(item.level),
        width: scaleX.bandwidth(),
        height: scaleY(item.value),
        color: colorMatrix.get(i, 0),
        // this attribute is used to calculate the with of left and right side overlay
        ribbonLength: [0, 0],
        ...item,
      }))
    })
    // stacked rect data
    this.#rectData.forEach(group => group.forEach((item, i) => {
      i !== 0 && (item.y = group[i - 1].y + group[i - 1].height + nodeGap)
    }))
    // move rect node according align value
    this.#rectData.forEach(group => {
      const tailNode = group[group.length - 1]
      if (type === directionType.HORIZONTAL) {
        const offset = layout.top + layout.height - tailNode.y - tailNode.height
        const moveY = align === alignType.END ? offset : align === alignType.MIDDLE ? offset / 2 : 0
        group.forEach(item => (item.y += moveY))
      } else if (type === directionType.VERTICAL) {
        const offset = layout.top + layout.width - tailNode.y - tailNode.height
        const moveX = align === alignType.END ? offset : align === alignType.MIDDLE ? offset / 2 : 0
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
    if (type === directionType.VERTICAL) {
      this.#rectData = this.#rectData.map(group => group.map(({x, y, height, width, ...other}) => ({
        width: height,
        height: width,
        x: y - layout.top + layout.left,
        y: x - layout.left + layout.top,
        ...other,
      })))
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
      if (type === directionType.HORIZONTAL) {
        return group.map(({x, y, width, height, name, value}) => this.createText({
          x: isLast ? x - labelOffset : x + width + labelOffset,
          y: y + height / 2,
          value: `${name}(${value})`,
          position: isLast ? 'left' : 'right',
          style: text,
        }))
      }
      if (type === directionType.VERTICAL) {
        return group.map(({x, y, width, height, name, value}) => this.createText({
          x: x + width / 2,
          y: isLast ? y - labelOffset : y + height + labelOffset,
          value: `${name}(${value})`,
          position: isLast ? 'top' : 'bottom',
          style: text,
        }))
      }
      return null
    })
  }

  draw() {
    const rectData = this.#rectData.map(group => {
      const data = group.map(({width, height}) => [width, height])
      const source = group.map(({dimension, name, value}) => ({dimension, category: name, value}))
      const position = group.map(({x, y}) => [x, y])
      const fill = group.map(({color}) => color)
      const transformOrigin = 'center'
      return {data, source, position, transformOrigin, ...this.#style.rect, fill}
    })
    const ribbonData = this.#ribbonData.map(({x1, y1, x2, y2, x3, y3, x4, y4, color}) => {
      const data = [this.#getPath([x1, y1, x3, y3, x4, y4, x2, y2])]
      return {data, ...this.#style.ribbon, fill: color}
    })
    const textData = this.#textData.map(group => {
      const data = group.map(({value}) => value)
      const position = group.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('rect', rectData)
    this.drawBasic('path', ribbonData, 'ribbon')
    this.drawBasic('text', textData)
  }
}

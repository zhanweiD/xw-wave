import * as d3 from 'd3'
import LayerBase from './base'
import Scale from '../data/scale'

// 对齐方式
const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

// 排列方向
const directionType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

// 默认选项
const defaultOptions = {
  type: directionType.HORIZONTAL,
}

// 默认样式
const defaultStyle = {
  nodeGap: 5,
  ribbonGap: 0,
  labelOffset: 5,
  align: alignType.START,
  rect: {},
  ribbon: {
    fillOpacity: 0.7,
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

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['rect', 'ribbon', 'text'])
    const {type} = this.options
    this.className = `wave-${type}-sankey`
    this.tooltipTargets = ['rect']
  }

  // 传入表格关系型数据
  setData(relation, scales) {
    this.#data = relation || this.#data
    const {nodes} = this.#data.data
    const {type, layout} = this.options
    const {width, height} = layout
    const levels = d3.range(0, d3.max(nodes.map(({level}) => level)) + 1)
    this.#scale.nice = {fixedBandWidth: 5, ...this.#scale.nice, ...scales.nice}
    this.#scale = this.createScale({
      scaleX: new Scale({
        type: 'band',
        domain: levels,
        range: type === directionType.HORIZONTAL ? [0, width] : [0, height],
        nice: this.#scale.nice,
      }),
      scaleY: new Scale({
        type: 'linear',
        domain: [0, 1],
        range: type === directionType.HORIZONTAL ? [0, height] : [0, width],
        nice: null,
      }),
    }, this.#scale, scales)
    // 根据层级分组节点
    this.#data.set('levels', levels)
    this.#data.set('groups', levels.map(value => nodes.filter(({level}) => level === value)))
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {links} = this.#data.data
    const {type, layout, createGradient} = this.options
    const {labelOffset, nodeGap, ribbonGap, align, text, rect} = this.#style
    const isHorizontal = type === directionType.HORIZONTAL
    const [levels, groups] = [this.#data.get('levels'), this.#data.get('groups')]
    // 计算包括间隙在内的理论最大数值
    const maxNumbers = levels.map(level => {
      const totalNumber = d3.sum(groups[level].map(({value}) => value))
      const gapLength = (groups[level].length - 1) * nodeGap
      const ratio = totalNumber / ((isHorizontal ? layout.height : layout.width) - gapLength)
      return totalNumber + gapLength * ratio
    })
    // 更新比例尺定义域和值域
    this.#scale.scaleY.domain([0, d3.max(maxNumbers)])
    const {scaleX, scaleY} = this.#scale
    // 基础矩形数据
    this.#rectData = groups.map(groupedNodes => {
      const colors = this.getColor(groupedNodes.length, rect.fill)
      return groupedNodes.map((item, i) => ({
        y: layout.top,
        x: layout.left + scaleX(item.level),
        width: scaleX.bandwidth(),
        height: scaleY(item.value),
        ribbonLength: [0, 0], // 用于计算左右边叠加的宽度
        color: colors[i],
        ...item,
      }))
    })
    // 堆叠柱子数据变更
    this.#rectData.forEach(groupData => groupData.forEach((item, i) => {
      i !== 0 && (item.y = groupData[i - 1].y + groupData[i - 1].height + nodeGap)
    }))
    // 对齐调整节点的位置
    this.#rectData.forEach(groupData => {
      const tailNode = groupData[groupData.length - 1]
      if (type === directionType.HORIZONTAL) {
        const offset = layout.top + layout.height - tailNode.y - tailNode.height
        const moveY = align === alignType.END ? offset : align === alignType.MIDDLE ? offset / 2 : 0
        groupData.forEach(item => item.y += moveY)
      } else if (type === directionType.VERTICAL) {
        const offset = layout.top + layout.width - tailNode.y - tailNode.height
        const moveX = align === alignType.END ? offset : align === alignType.MIDDLE ? offset / 2 : 0
        groupData.forEach(item => item.y += moveX)
      }
    })
    // 丝带数据
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
    // 横竖坐标转换
    if (type === directionType.VERTICAL) {
      this.#rectData = this.#rectData.map(groupData => groupData.map(({x, y, height, width, ...other}) => ({
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
    // 标签文字数据
    this.#textData = this.#rectData.map((groupData, i) => {
      const isLast = i === this.#rectData.length - 1
      if (type === directionType.HORIZONTAL) {
        return groupData.map(({x, y, width, height, name, value}) => this.createText({
          x: isLast ? x - labelOffset : x + width + labelOffset,
          y: y + height / 2,
          value: `${name}(${value})`,
          position: isLast ? 'left' : 'right',
          style: text,
        }))
      }
      if (type === directionType.VERTICAL) {
        return groupData.map(({x, y, width, height, name, value}) => this.createText({
          x: x + width / 2,
          y: isLast ? y - labelOffset : y + height + labelOffset,
          value: `${name}(${value})`,
          position: isLast ? 'top' : 'bottom',
          textAnchor: isLast ? 'end' : 'start',
          style: text,
        }))
      }
      return null
    })
  }

  // 绘制
  draw() {
    const {type} = this.options
    const rectData = this.#rectData.map(groupData => {
      const data = groupData.map(({width, height}) => [width, height])
      const source = groupData.map(({dimension, name, value}) => ({dimension, category: name, value}))
      const position = groupData.map(({x, y}) => [x, y])
      const fill = groupData.map(({color}) => color)
      const transformOrigin = 'center'
      return {data, source, position, transformOrigin, ...this.#style.rect, fill}
    })
    const ribbonData = this.#ribbonData.map(({x1, y1, x2, y2, x3, y3, x4, y4, color}) => {
      const data = [[x1, y1, x3, y3, x4, y4, x2, y2]]
      return {type: `sankey-${type}`, data, ...this.#style.ribbon, fill: color}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      const textAnchor = groupData.map(item => item.textAnchor)
      return {data, position, textAnchor, ...this.#style.text}
    })
    this.drawBasic('rect', rectData)
    this.drawBasic('ribbon', ribbonData)
    this.drawBasic('text', textData)
  }
}

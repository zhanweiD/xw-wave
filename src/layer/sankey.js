import * as d3 from 'd3'
import LayerBase from './base'
import Scale from '../data/scale'

// 排列方向
const directionType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

// 默认样式
const defaultStyle = {
  labelOffset: 5,
  rect: {},
  ribbon: {
    fillOpacity: 0.7,
  },
  text: {},
}

// 矩形图层
export default class SankeyLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #rectData = {}

  #ribbonData = {}

  #textData = {}

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
    super(layerOptions, waveOptions)
    const {direction = directionType.HORIZONTAL} = this.options
    this.className = `wave-${direction}-sankey`
  }

  // 传入表格关系型数据
  setData(relation, scales) {
    this.#data = relation || this.#data
    const nodeGap = 5
    const {nodes, links} = this.#data.data
    const {width, height, left, top} = this.options.layout
    const {direction = directionType.HORIZONTAL} = this.options
    this.#scale.nice = {fixedBandWidth: 5, ...this.#scale.nice, ...scales.nice}
    const domain = d3.range(0, d3.max(nodes.map(({level}) => level)) + 1)
    const groups = domain.map(value => nodes.filter(({level}) => level === value))
    // 计算包括间隙在内的理论最大数值
    const totalBandHeights = domain.map(level => {
      const totalNumber = d3.sum(groups[level].map(({value}) => value))
      const gapLength = (groups[level].length - 1) * nodeGap
      const ratio = totalNumber / ((direction === directionType.HORIZONTAL ? height : width) - gapLength)
      return totalNumber + gapLength * ratio
    })
    this.#scale = this.createScale({
      scaleX: new Scale({
        type: 'band',
        domain,
        range: direction === directionType.HORIZONTAL ? [0, width] : [0, height],
        nice: this.#scale.nice,
      }),
      scaleY: new Scale({
        type: 'linear',
        domain: [0, d3.max(totalBandHeights)],
        range: direction === directionType.HORIZONTAL ? [0, height] : [0, width],
        nice: null,
      }),
    }, this.#scale, scales)
    // 基础矩形数据
    const {scaleX, scaleY} = this.#scale
    this.#rectData = groups.map(groupedNodes => {
      return groupedNodes.map(({level, value, ...other}) => ({
        value,
        y: top,
        x: left + scaleX(level),
        width: scaleX.bandwidth(),
        height: scaleY(value),
        // 用于计算左右边叠加的宽度
        ribbonLength: [0, 0],
        ...other,
      }))
    })
    // 堆叠柱状数据变更
    this.#rectData = this.#rectData.map(groupData => {
      return groupData.reduce((prev, cur, index) => {
        return [...prev, {
          ...cur, 
          y: prev[index].y + prev[index].height + nodeGap,
        }]
      }, [{y: groupData[0].y - nodeGap, height: 0}]).slice(1)
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
        x1: fromNode.x + fromNode.width,
        y1: fromNode.y + fromNode.ribbonLength[1] - length,
        x2: fromNode.x + fromNode.width,
        y2: fromNode.y + fromNode.ribbonLength[1],
        x3: toNode.x,
        y3: toNode.y + toNode.ribbonLength[0] - length,
        x4: toNode.x,
        y4: toNode.y + toNode.ribbonLength[0],
      }
    })
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {labelOffset, text} = this.#style
    const {fontSize, format} = text
    // 每一组的颜色取决于这一组的节点数量
    this.#rectData.forEach(groupData => {
      const colors = this.getColor(groupData.length, this.#style.rect?.fill)
      groupData.forEach((rectData, i) => rectData.color = colors[i])
    })
    // 丝带暂时用开始节点的颜色
    this.#ribbonData.forEach(ribbon => ribbon.color = ribbon.from.color)
    // 标签文字数据
    this.#textData = this.#rectData.map((groupData, i) => {
      const isLast = i === this.#rectData.length - 1
      return groupData.map(({name, value, x, y, width, height}) => this.createText({
        format,
        fontSize,
        x: isLast ? x - labelOffset : x + width + labelOffset,
        y: y + height / 2,
        value: `${name}(${value})`,
        position: isLast ? 'left' : 'right',
      }))
    })
  }

  // 绘制
  draw() {
    const rectData = this.#rectData.map(groupData => {
      const data = groupData.map(({width, height}) => [width, height])
      const source = groupData.map(({dimension, category, value}) => ({dimension, category, value}))
      const position = groupData.map(({x, y}) => [x, y])
      const fill = groupData.map(({color}) => color)
      const transformOrigin = 'center'
      return {data, source, position, transformOrigin, ...this.#style.rect, fill}
    })
    const ribbonData = this.#ribbonData.map(({x1, y1, x2, y2, x3, y3, x4, y4, color}) => {
      const data = [[x1, y1, x2, y2, x3, y3, x4, y4]]
      return {type: 'customize', data, ...this.#style.ribbon, fill: color}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('rect', rectData)
    this.drawBasic('ribbon', ribbonData)
    this.drawBasic('text', textData)
  }
}

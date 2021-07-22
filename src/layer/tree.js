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
  labelOffset: 5,
  align: alignType.START,
  circleSize: 10,
  circle: {},
  curve: {},
  text: {},
}

// 矩形图层
export default class TreeLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #circleData = {}

  #curveData = {}

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
    super({...defaultOptions, ...layerOptions}, waveOptions, ['circle', 'curve', 'text'])
    const {type} = this.options
    this.className = `wave-${type}-tree`
    this.tooltipTargets = ['circle']
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
    const {type, layout} = this.options
    const {labelOffset, circleSize, align, text, circle} = this.#style
    const groups = this.#data.get('groups')
    // 计算最大节点数
    const maxNumber = d3.max(groups.map(item => item.length - 1))
    // 更新比例尺定义域和值域
    this.#scale.scaleY.domain([0, maxNumber])
    this.#scale.scaleY.range([circleSize / 2, this.#scale.scaleY.range()[1] - circleSize / 2])
    const {scaleX, scaleY} = this.#scale
    // 节点基础数据
    this.#circleData = groups.map(groupedNodes => {
      const colors = this.getColor(groupedNodes.length, circle.fill)
      return groupedNodes.map((item, i) => ({
        cx: layout.left + scaleX(item.level),
        cy: layout.top + scaleY(i),
        rx: circleSize / 2,
        ry: circleSize / 2,
        color: colors[i],
        ...item,
      }))
    })
    // 对齐调整节点的位置
    this.#circleData.forEach(groupData => {
      const tailNode = groupData[groupData.length - 1]
      if (type === directionType.HORIZONTAL) {
        const offset = layout.top + layout.height - tailNode.cy - tailNode.ry
        const moveY = align === alignType.END ? offset : align === alignType.MIDDLE ? offset / 2 : 0
        groupData.forEach(item => item.cy += moveY)
      } else if (type === directionType.VERTICAL) {
        const offset = layout.left + layout.width - tailNode.cy - tailNode.rx
        const moveX = align === alignType.END ? offset : align === alignType.MIDDLE ? offset / 2 : 0
        groupData.forEach(item => item.cy += moveX)
      }
    })
    // 连线数据
    const rects = this.#circleData.reduce((prev, cur) => [...prev, ...cur])
    this.#curveData = links.map(({from, to}) => {
      const fromNode = rects.find(({id}) => id === from)
      const toNode = rects.find(({id}) => id === to)
      return {
        from: fromNode,
        to: toNode,
        x1: fromNode.cx,
        y1: fromNode.cy,
        x2: toNode.cx,
        y2: toNode.cy,
        color: fromNode.color,
      }
    })
    // 横竖坐标转换
    if (type === directionType.VERTICAL) {
      this.#circleData = this.#circleData.map(groupData => groupData.map(({cx, cy, ...other}) => ({
        cx: cy - layout.top + layout.left,
        cy: cx - layout.left + layout.top, 
        ...other,
      })))
      this.#curveData = this.#curveData.map(({x1, y1, x2, y2, ...other}) => ({
        ...other,
        x1: y1 - layout.top + layout.left,
        y1: x1 - layout.left + layout.top,
        x2: y2 - layout.top + layout.left,
        y2: x2 - layout.left + layout.top,
      }))
    }
    // 标签文字数据
    this.#textData = this.#circleData.map(groupData => {
      if (type === directionType.HORIZONTAL) {
        return groupData.map(({cx, cy, ry, name}) => this.createText({
          x: cx + labelOffset,
          y: cy + ry / 2,
          value: name,
          position: 'right',
          style: text,
        }))
      }
      if (type === directionType.VERTICAL) {
        return groupData.map(({cx, cy, ry, name}) => this.createText({
          x: cx,
          y: cy + ry + labelOffset,
          value: name,
          position: 'bottom',
          style: text,
        }))
      }
      return null
    })
  }

  // 绘制
  draw() {
    const circleData = this.#circleData.map(groupData => {
      const source = groupData.map(({dimension, name, value}) => ({dimension, category: name, value}))
      const data = groupData.map(({rx, ry}) => [rx, ry])
      const position = groupData.map(({cx, cy}) => [cx, cy])
      const fill = groupData.map(({color}) => color)
      const transformOrigin = 'center'
      return {data, source, position, transformOrigin, ...this.#style.rect, fill}
    })
    const curveData = [{
      position: this.#curveData.map(({x1, y1, x2, y2}) => [[x1, y1], [x2, y2]]),
      stroke: this.#curveData.map(({color}) => color),
      ...this.#style.curve,
    }]
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      const textAnchor = groupData.map(item => item.textAnchor)
      return {data, position, textAnchor, ...this.#style.text}
    })
    this.drawBasic('curve', curveData)
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

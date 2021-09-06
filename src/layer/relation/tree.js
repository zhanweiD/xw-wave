import * as d3 from 'd3'
import {isNumber} from 'lodash'
import LayerBase from '../base'
import Scale from '../../data/scale'

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

// 数值标签位置
const labelPositionType = {
  INNER: 'inner',
  OUTER: 'outer',
}

// 默认选项
const defaultOptions = {
  type: directionType.HORIZONTAL,
}

// 默认样式
const defaultStyle = {
  labelOffset: 5,
  labelPosition: labelPositionType.OUTER,
  align: alignType.START,
  circleSize: 10,
  circle: {},
  curve: {
    curve: 'curveLinear',
  },
  text: {},
}

export default class TreeLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #circleData = []

  #curveData = []

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
    this.#scale = this.createScale({
      scaleX: new Scale({
        type: 'point',
        domain: levels,
        range: type === directionType.HORIZONTAL ? [0, width] : [0, height],
      }),
      scaleY: new Scale({
        type: 'linear',
        domain: [0, 1],
        range: type === directionType.HORIZONTAL ? [0, height] : [0, width],
      }),
    }, this.#scale, scales)
    // 根据层级分组节点
    this.#data.set('levels', levels)
    this.#data.set('groups', levels.map(value => nodes.filter(({level}) => level === value)))
    // dfs 插入叶子节点的横向顺序
    let order = -1
    const dfs = node => {
      if (node.children.length === 0) {
        node.order = ++order
      } else {
        node.children.forEach(child => dfs(child))
      }
    }
    this.#data.get('groups')[0].forEach(dfs)
    this.#data.set('maxOrder', order)
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {labelOffset, labelPosition, circleSize, align, text, circle, curve} = this.#style
    const {type, layout} = this.options
    const {links} = this.#data.data
    const groups = this.#data.get('groups')
    // 更新比例尺定义域和值域
    this.#scale.scaleX.range([circleSize / 2, this.#scale.scaleX.range()[1] - circleSize / 2])
    this.#scale.scaleY.range([circleSize / 2, this.#scale.scaleY.range()[1] - circleSize / 2])
    this.#scale.scaleY.domain([0, this.#data.get('maxOrder')])
    const {scaleX, scaleY} = this.#scale
    // 节点基础数据
    this.#circleData = []
    for (let i = 0; i < groups.length; i++) {
      const groupedNodes = groups[groups.length - i - 1]
      const colors = this.getColor(groupedNodes.length, circle.fill)
      this.#circleData[i] = groupedNodes.map((item, j) => ({
        cx: layout.left + scaleX(item.level),
        cy: layout.top + (isNumber(item.order) ? scaleY(item.order) : item.cy),
        r: circleSize / 2,
        color: colors[j],
        ...item,
      }))
      // 根据子节点的位置刷新父节点的位置
      this.#circleData[i].forEach(({cy, parents}) => parents.forEach(parent => {
        if (!parent.cy) parent.cy = cy;
        // 确定子节点的最大坐标和最小坐标
        [parent.min, parent.max] = [Math.min(cy, parent.min || cy), Math.max(cy, parent.max || cy)]
        if (align === alignType.START) {
          parent.cy = parent.min
        } else if (align === alignType.MIDDLE) {
          parent.cy = (parent.min + parent.max) / 2
        } else if (align === alignType.END) {
          parent.cy = parent.max
        }
      }))
    }
    // 连线基础数据
    const rects = this.#circleData.reduce((prev, cur) => [...prev, ...cur])
    this.#curveData = [links.map(({from, to}) => {
      const fromNode = rects.find(({id}) => id === from)
      const toNode = rects.find(({id}) => id === to)
      return {
        x1: fromNode.cx,
        y1: fromNode.cy,
        x2: toNode.cx,
        y2: toNode.cy,
        color: fromNode.color,
      }
    })]
    // 横竖坐标转换
    if (type === directionType.VERTICAL) {
      this.#circleData = this.#circleData.map(groupData => groupData.map(({cx, cy, ...other}) => ({
        cx: cy - layout.top + layout.left,
        cy: cx - layout.left + layout.top, 
        ...other,
      })))
      this.#curveData = this.#curveData.map(groupData => groupData.map(({x1, y1, x2, y2, ...other}) => ({
        ...other,
        x1: y1 - layout.top + layout.left,
        y1: x1 - layout.left + layout.top,
        x2: y2 - layout.top + layout.left,
        y2: x2 - layout.left + layout.top,
      })))
    }
    // 阶梯曲线模式需要优化以获得更好的展示效果
    if (curve.curve.match(/step/i)) {
      const keys = Array.from(new Set(this.#curveData[0].map(({x1, y1}) => `${x1}${y1}`)))
      this.#curveData = keys.map(key => this.#curveData[0].filter(({x1, y1}) => `${x1}${y1}` === key))
      // 重构线的数据，注意前面计算的数据是从叶子到根
      this.#curveData = this.#curveData.map(groupData => {
        const {x1, x2, y1, y2} = groupData[0]
        const medianX = type === directionType.VERTICAL ? x1 : (x1 + x2) / 2
        const medianY = type === directionType.HORIZONTAL ? y1 : (y1 + y2) / 2
        const masterLine = {...groupData[0], x2: medianX, y2: medianY}
        const slaveLines = groupData.map(({...other}) => ({
          ...other, 
          x1: medianX, 
          y1: medianY,
        }))
        return [masterLine, ...slaveLines]
      })
    }
    // 标签文字数据
    this.#textData = this.#circleData.map((groupData, i) => {
      const isSpecial = (labelPosition === labelPositionType.OUTER && i === 0)
        || (labelPosition === labelPositionType.INNER && i === this.#circleData.length - 1)
      if (type === directionType.HORIZONTAL) {
        return groupData.map(({cx, cy, r, name}) => this.createText({
          x: isSpecial ? cx + r + labelOffset : cx - r - labelOffset,
          y: cy,
          position: isSpecial ? 'right' : 'left',
          style: text,
          value: name,
        }))
      }
      if (type === directionType.VERTICAL) {
        return groupData.map(({cx, cy, r, name}) => this.createText({
          x: cx,
          y: isSpecial ? cy + r + labelOffset : cy - r - labelOffset,
          position: isSpecial ? 'bottom' : 'top',
          style: text,
          value: name,
        }))
      }
      return null
    })
  }

  // 绘制
  draw() {
    const circleData = this.#circleData.map(groupData => {
      const source = groupData.map(({dimension, name, value}) => ({dimension, category: name, value}))
      const data = groupData.map(({r}) => [r, r])
      const position = groupData.map(({cx, cy}) => [cx, cy])
      const fill = groupData.map(({color}) => color)
      const transformOrigin = 'center'
      return {data, source, position, transformOrigin, fill, ...this.#style.rect}
    })
    const curveData = this.#curveData.map(groupData => ({
      data: groupData.map(({x1, y1, x2, y2}) => [[x1, y1], [x2, y2]]),
      ...this.#style.curve,
      stroke: groupData.map(({color}) => color),
    }))
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('curve', curveData)
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

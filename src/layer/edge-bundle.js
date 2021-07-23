import * as d3 from 'd3'
import Scale from '../data/scale'
import LayerBase from './base'

// 默认样式
const defaultStyle = {
  circleSize: [5, 20],
  labelOffset: 5,
  text: {},
  curve: {
    strokeWidth: 1,
    curve: 'curveBasis',
  },
  circle: {},
}

// 矩形图层
export default class EdgeBundleLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #curveData = {}

  #circleData = {}

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
    super(layerOptions, waveOptions, ['circle', 'curve', 'text'])
    this.className = 'wave-edge-bundle'
    this.tooltipTargets = ['circle']
  }

  // 传入列表类，三列分别为起点终点和数值
  setData(relation) {
    this.#data = relation || this.#data
    const {left, top, width, height} = this.options.layout
    const maxRadius = Math.min(width, height) / 2
    const [centerX, centerY] = [left + width / 2, top + height / 2]
    const root = {name: 'root', children: this.#data.data.nodes}
    // d3 的 hierarchy 方法对 children 有要求
    this.#data.data.nodes.forEach(node => delete node.children)
    const nodes = d3.cluster().size([360, maxRadius]).separation((a, b) => {
      const v1 = Math.log(a.data.value) * Math.log(a.data.value) || 1
      const v2 = Math.log(b.data.value) * Math.log(b.data.value) || 1
      return v1 > v2 ? v1 : v2
    })(d3.hierarchy(root)).leaves()
    // 边数据
    this.#curveData = this.#data.data.links.map(({from, to}) => {
      const source = nodes.find(({data}) => data.name === from)
      const target = nodes.find(({data}) => data.name === to)
      const [angle1, angle2] = [(source.x / 180) * Math.PI, (target.x / 180) * Math.PI]
      const [radius1, radius2] = [source.y, target.y]
      const [x1, y1] = [Math.sin(angle1) * radius1 + centerX, centerY - Math.cos(angle1) * radius1]
      const [x2, y2] = [Math.sin(angle2) * radius2 + centerX, centerY - Math.cos(angle2) * radius2]
      const [curveX, curveY] = [(x1 + x2) / 4 + centerX / 2, (y1 + y2) / 4 + centerY / 2]
      return {curveX, curveY, x1, y1, x2, y2, category: source.data.category}
    })
    // 节点数据简化成原点数据
    const categorys = Array.from(new Set(nodes.map(({data}) => data.category)))
    this.#circleData = categorys.map(category => {
      return nodes.filter(({data}) => data.category === category).map(({data, x, y}) => {
        const [angle, radius] = [(x / 180) * Math.PI, y]
        const [cx, cy] = [Math.sin(angle) * radius + centerX, centerY - Math.cos(angle) * radius]
        return {source: data, cx, cy, angle, radius}
      })
    })
    // 计算一些衍生数据
    this.#data.set('maxValue', d3.max(nodes.map(({data}) => data.value)))
    this.#data.set('minValue', d3.min(nodes.map(({data}) => data.value)))
    this.#data.set('categorys', categorys)
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, width, height} = this.options.layout
    const [centerX, centerY] = [left + width / 2, top + height / 2]
    const {circleSize, labelOffset, text, circle, curve} = this.#style
    const sizeScale = new Scale({
      type: 'linear',
      domain: [this.#data.get('minValue'), this.#data.get('maxValue')],
      range: circleSize,
      nice: null,
    })
    // 圆的大小随数值变化
    this.#circleData.forEach(groupData => groupData.forEach(item => {
      item.r = sizeScale(item.source.value)
    }))
    // 节点和边的颜色数据
    const categorys = this.#data.get('categorys')
    const circleColors = this.getColor(categorys.length, circle.fill)
    this.#circleData.forEach(groupData => groupData.forEach((item => {
      item.color = circleColors[categorys.findIndex(value => value === item.source.category)]
    })))
    const curveColors = this.getColor(categorys.length, curve.fill)
    this.#curveData.forEach(item => {
      item.color = curveColors[categorys.findIndex(value => value === item.category)]
    })
    // 标签数据
    this.#textData = this.#circleData.map(groupData => groupData.map(({r, source, angle, radius}) => {
      const totalRadius = r + radius + labelOffset
      const textAnchor = angle > Math.PI ? 'end' : 'start'
      const [x, y] = [Math.sin(angle) * totalRadius + centerX, centerY - Math.cos(angle) * totalRadius]
      const data = this.createText({x, y, value: source.name, position: 'right', style: text})
      return {...data, textAnchor, angle: ((angle / Math.PI) * 180 - (angle > Math.PI ? 270 : 90))}
    }))
  }

  // 绘制
  draw() {
    const circleData = this.#circleData.map(groupData => {
      const data = groupData.map(({r}) => [r, r])
      const position = groupData.map(({cx, cy}) => [cx, cy])
      const source = groupData.map(item => ({...item.source, dimension: item.source.name}))
      const fill = groupData.map(({color}) => color)
      return {data, position, source, ...this.#style.circle, fill}
    })
    const curveData = this.#curveData.map(({x1, y1, x2, y2, curveX, curveY, color}) => ({
      position: [[[x1, y1], [curveX, curveY], [x2, y2]]],
      ...this.#style.curve,
      stroke: color,
    }))
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      const rotation = groupData.map(({angle}) => angle)
      const textAnchor = groupData.map(item => item.textAnchor)
      const transformOrigin = groupData.map(item => item.transformOrigin)
      return {data, position, textAnchor, transformOrigin, ...this.#style.text, rotation}
    })
    this.drawBasic('curve', curveData)
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

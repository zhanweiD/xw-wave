import * as d3 from 'd3'
import Scale from '../../data/scale'
import LayerBase from '../base'

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

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['circle', 'curve', 'text'])
    this.className = 'wave-edge-bundle'
    this.tooltipTargets = ['circle']
  }

  setData(relation) {
    this.#data = relation || this.#data
    const {left, top, width, height} = this.options.layout
    const maxRadius = Math.min(width, height) / 2
    const [centerX, centerY] = [left + width / 2, top + height / 2]
    const root = {name: 'root', children: this.#data.data.nodes}
    // hierarchy needs formatted children
    this.#data.data.nodes.forEach(node => delete node.children)
    const nodes = d3
      .cluster()
      .size([360, maxRadius])
      .separation((a, b) => {
        const v1 = Math.log(a.data.value) * Math.log(a.data.value) || 1
        const v2 = Math.log(b.data.value) * Math.log(b.data.value) || 1
        return v1 > v2 ? v1 : v2
      })(d3.hierarchy(root))
      .leaves()
    // link data
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
    // transform node data to circle data
    const categorys = Array.from(new Set(nodes.map(({data}) => data.category)))
    this.#circleData = categorys.map(category => {
      return nodes
        .filter(({data}) => data.category === category)
        .map(({data, x, y}) => {
          const [angle, radius] = [(x / 180) * Math.PI, y]
          const [cx, cy] = [Math.sin(angle) * radius + centerX, centerY - Math.cos(angle) * radius]
          return {source: data, cx, cy, angle, radius}
        })
    })
    // some derived data
    this.#data.set('maxValue', d3.max(nodes.map(({data}) => data.value)))
    this.#data.set('minValue', d3.min(nodes.map(({data}) => data.value)))
    this.#data.set('categorys', categorys)
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, width, height} = this.options.layout
    const [centerX, centerY] = [left + width / 2, top + height / 2]
    const {circleSize, labelOffset, text, circle, curve} = this.#style
    const sizeScale = new Scale({
      type: 'linear',
      domain: [this.#data.get('minValue'), this.#data.get('maxValue')],
      range: circleSize,
    })
    // circle size changed by with value
    this.#circleData.forEach(group => group.forEach(item => {
      item.r = sizeScale(item.source.value)
    }))
    // colors for nodes and links
    const categorys = this.#data.get('categorys')
    const circleColors = this.getColor(categorys.length, circle.fill)
    this.#circleData.forEach(group => group.forEach(item => {
      item.color = circleColors[categorys.findIndex(value => value === item.source.category)]
    }))
    const curveColors = this.getColor(categorys.length, curve.fill)
    this.#curveData.forEach(item => {
      item.color = curveColors[categorys.findIndex(value => value === item.category)]
    })
    // label data
    this.#textData = this.#circleData.map(group => group.map(({r, source, angle, radius}) => {
      const totalRadius = r + radius + labelOffset
      const [x, y] = [Math.sin(angle) * totalRadius + centerX, centerY - Math.cos(angle) * totalRadius]
      const data = this.createText({x, y, value: source.name, position: 'center', style: text})
      if (this.options.engine === 'svg') {
        data.x += angle > Math.PI ? -data.textWidth / 2 : data.textWidth / 2
      } else if (this.options.engine === 'canvas') {
        data.x += Math.sin(angle) * (data.textWidth / 2)
        data.y += Math.sin(angle - Math.PI / 2) * (data.textWidth / 2)
      }
      return {...data, angle: (angle / Math.PI) * 180 - (angle > Math.PI ? 270 : 90)}
    }))
  }

  draw() {
    const circleData = this.#circleData.map(group => {
      const data = group.map(({r}) => [r, r])
      const position = group.map(({cx, cy}) => [cx, cy])
      const source = group.map(item => ({...item.source, dimension: item.source.name}))
      const fill = group.map(({color}) => color)
      return {data, position, source, ...this.#style.circle, fill}
    })
    const curveData = this.#curveData.map(({x1, y1, x2, y2, curveX, curveY, color}) => ({
      data: [
        [
          [x1, y1],
          [curveX, curveY],
          [x2, y2],
        ],
      ],
      ...this.#style.curve,
      stroke: color,
    }))
    const textData = this.#textData.map(group => {
      const data = group.map(({value}) => value)
      const position = group.map(({x, y}) => [x, y])
      const rotation = group.map(({angle}) => angle)
      const transformOrigin = group.map(item => item.transformOrigin)
      return {data, position, transformOrigin, ...this.#style.text, rotation}
    })
    this.drawBasic('curve', curveData)
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

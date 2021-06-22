import * as d3 from 'd3'
import LayerBase from './base'

// 默认样式
const defaultStyle = {
  arcWidth: 10,
  labelOffset: 5,
  ribbon: {
    fillOpacity: 0.7,
  },
  text: {},
  arc: {},
}

// 矩形图层
export default class ChordLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #arcData = {}

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
    this.className = 'wave-chord'
  }

  // 传入表格关系型数据
  setData(table) {
    this.#data = table || this.#data
    const [categorys, matrix] = [this.#data.data[0], this.#data.data[2]]
    const chordData = d3.chord().padAngle(Math.PI / 10 / categorys.length)(matrix)
    this.#ribbonData = chordData
    // 弧度制转换成角度值
    this.#arcData = chordData.groups.map(({startAngle, endAngle, ...other}, i) => ({
      category: categorys[i],
      startAngle: (startAngle / Math.PI) * 180,
      endAngle: (endAngle / Math.PI) * 180,
      ...other,
    }))
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, width, height} = this.options.layout
    const maxRadius = Math.min(width, height) / 2
    const [centerX, centerY] = [left + width / 2, top + height / 2]
    const {arcWidth, labelOffset, text} = this.#style
    const innerRadius = maxRadius - arcWidth
    // 补充圆弧数据
    const arcColors = this.getColor(this.#arcData.length, this.#style.arc?.fill, true)
    this.#arcData = this.#arcData.map((item, i) => ({
      ...item,
      innerRadius,
      outerRadius: maxRadius,
      color: arcColors[i],
      position: [centerX, centerY],
    }))
    // 补充边数据
    const ribbonColors = this.getColor(this.#arcData.length, this.#style.ribbon?.fill, true)
    this.#ribbonData = this.#ribbonData.map(({source, target}) => ({
      index: target.index,
      position: [centerX, centerY],
      data: [source.startAngle, source.endAngle, innerRadius, target.startAngle, target.endAngle, innerRadius],
      color: ribbonColors[this.#arcData.findIndex(({index}) => index === target.index)],
    }))
    // 给边数据进行分类
    this.#ribbonData.sort((a, b) => a.index - b.index)
    this.#ribbonData = this.#ribbonData.reduce((prev, cur) => {
      const prevGroup = prev[prev.length - 1]
      const prevIndex = prevGroup[prevGroup.length - 1].index
      if (prevIndex === cur.index) {
        prevGroup.push(cur)
        return prev
      } 
      return [...prev, [cur]]
    }, [[{index: -1}]]).slice(1)
    // 标签数据
    this.#textData = this.#arcData.map(({startAngle, endAngle, outerRadius, category}) => {
      const angle = ((startAngle + endAngle) / 360) * Math.PI
      const totalRadius = outerRadius + labelOffset
      const textAnchor = angle > Math.PI ? 'end' : 'start'
      const [x, y] = [Math.sin(angle) * totalRadius + centerX, centerY - Math.cos(angle) * totalRadius]
      const data = this.createText({x, y, value: category, position: 'right', style: text})
      return {...data, textAnchor, angle: ((angle / Math.PI) * 180 - (angle > Math.PI ? 270 : 90))}
    })
  }

  // 绘制
  draw() {
    const arcData = [{
      data: this.#arcData.map(({startAngle, endAngle, innerRadius, outerRadius}) => [
        startAngle, endAngle, innerRadius, outerRadius,
      ]),
      position: this.#arcData.map(({position}) => position),
      source: this.#arcData.map(({category, value}) => ({category, value})),
      ...this.#style.arc,
      fill: this.#arcData.map(({color}) => color),
    }]
    const ribbonData = this.#ribbonData.map(groupData => {
      const position = groupData.map(item => item.position)
      const data = groupData.map(item => item.data)
      const fill = groupData.map(({color}) => color)
      return {type: 'chord', data, position, ...this.#style.ribbon, fill}
    })
    const textData = [{
      data: this.#textData.map(({value}) => value),
      position: this.#textData.map(({x, y}) => [x, y]),
      rotation: this.#textData.map(({angle}) => angle),
      textAnchor: this.#textData.map(item => item.textAnchor),
      transformOrigin: this.#textData.map(item => item.transformOrigin),
      ...this.#style.text,
    }]
    this.drawBasic('arc', arcData)
    this.drawBasic('ribbon', ribbonData)
    this.drawBasic('text', textData)
  }
}
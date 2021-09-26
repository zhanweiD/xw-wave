import * as d3 from 'd3'
import LayerBase from '../base'

const defaultStyle = {
  arcWidth: 10,
  labelOffset: 5,
  ribbon: {
    fillOpacity: 0.7,
    strokeOpacity: 0,
  },
  text: {},
  arc: {},
}

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

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['ribbon', 'arc', 'text'])
    this.className = 'wave-chord'
    this.tooltipTargets = ['arc']
  }

  setData(table) {
    this.#data = table || this.#data
    const [categorys, matrix] = [this.#data.data[0], this.#data.data[2]]
    const chordData = d3.chord().padAngle(Math.PI / 10 / categorys.length)(matrix)
    this.#data.set('chordData', chordData)
    // convert radians to angles
    this.#arcData = chordData.groups.map(({startAngle, endAngle, ...other}, i) => ({
      category: categorys[i],
      startAngle: (startAngle / Math.PI) * 180,
      endAngle: (endAngle / Math.PI) * 180,
      ...other,
    }))
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, width, height} = this.options.layout
    const maxRadius = Math.min(width, height) / 2
    const [centerX, centerY] = [left + width / 2, top + height / 2]
    const {arcWidth, labelOffset, text, arc, ribbon} = this.#style
    const radius = maxRadius - arcWidth
    // extra arc data
    const arcColors = this.getColor(this.#arcData.length, arc.fill)
    this.#arcData = this.#arcData.map((item, i) => ({
      ...item,
      innerRadius: radius,
      outerRadius: maxRadius,
      color: arcColors[i],
      position: [centerX, centerY],
    }))
    // extra ribbon data
    const ribbonColors = this.getColor(this.#arcData.length, ribbon.fill)
    this.#ribbonData = this.#data.get('chordData').map(({source, target}) => ({
      index: target.index,
      position: [centerX, centerY],
      data: d3.ribbon()({source: {...source, radius}, target: {...target, radius}}),
      color: ribbonColors[this.#arcData.findIndex(({index}) => index === target.index)],
    }))
    // classify ribbons
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
    // label data
    this.#textData = this.#arcData.map(({startAngle, endAngle, outerRadius, category}) => {
      const angle = ((startAngle + endAngle) / 360) * Math.PI
      const totalRadius = outerRadius + labelOffset
      const [x, y] = [Math.sin(angle) * totalRadius + centerX, centerY - Math.cos(angle) * totalRadius]
      const data = this.createText({x, y, value: category, position: 'center', style: text})
      if (this.options.engine === 'svg') {
        data.x += angle > Math.PI ? -data.textWidth / 2 : data.textWidth / 2
      } else if (this.options.engine === 'canvas') {
        data.x += Math.sin(angle) * (data.textWidth / 2)
        data.y += Math.sin(angle - Math.PI / 2) * (data.textWidth / 2)
      }
      return {...data, angle: ((angle / Math.PI) * 180 - (angle > Math.PI ? 270 : 90))}
    })
  }

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
    const ribbonData = this.#ribbonData.map(group => {
      const data = group.map(item => item.data)
      const fill = group.map(({color}) => color)
      const position = group.map(item => item.position)
      return {data, position, ...this.#style.ribbon, fill}
    })
    const textData = [{
      data: this.#textData.map(({value}) => value),
      position: this.#textData.map(({x, y}) => [x, y]),
      transformOrigin: this.#textData.map(item => item.transformOrigin),
      rotation: this.#textData.map(({angle}) => angle),
      ...this.#style.text,
    }]
    this.drawBasic('arc', arcData)
    this.drawBasic('path', ribbonData, 'ribbon')
    this.drawBasic('text', textData)
  }
}

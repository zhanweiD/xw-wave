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

  constructor(layerOptions, chartOptions) {
    super(layerOptions, chartOptions, ['ribbon', 'arc', 'text', 'gradient'])
    this.className = 'chart-chord'
    this.tooltipTargets = ['arc']
  }

  setData(table) {
    this.#data = this.createData('table', this.#data, table)
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
    const {id, type} = this.options
    this.#style = this.createStyle(defaultStyle, this.#style, style, id, type)

    const {left, top, width, height} = this.options.layout
    const maxRadius = Math.min(width, height) / 2
    const [centerX, centerY] = [left + width / 2, top + height / 2]
    const {arcWidth, labelOffset, text, colorList} = this.#style
    const radius = maxRadius - arcWidth
    const colorMatrix = this.getColorMatrix(1, this.#arcData.length, colorList)
    // extra arc data
    this.#arcData = this.#arcData.map((item, i) => ({
      ...item,
      innerRadius: radius,
      outerRadius: maxRadius,
      color: colorMatrix.get(0, i),
      position: [centerX, centerY],
    }))
    // extra ribbon data
    this.#ribbonData = this.#data.get('chordData').map(({source, target}) => ({
      index: target.index,
      position: [centerX, centerY],
      data: d3.ribbon()({source: {...source, radius}, target: {...target, radius}}),
      color: colorMatrix.matrix[0][this.#arcData.findIndex(({index}) => index === target.index)],
    }))
    // classify ribbons
    this.#ribbonData.sort((a, b) => a.index - b.index)
    this.#ribbonData = this.#ribbonData
      .reduce(
        (prev, cur) => {
          const prevGroup = prev[prev.length - 1]
          const prevIndex = prevGroup[prevGroup.length - 1].index
          if (prevIndex === cur.index) {
            prevGroup.push(cur)
            return prev
          }
          return [...prev, [cur]]
        },
        [[{index: -1}]]
      )
      .slice(1)
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
      return {...data, angle: (angle / Math.PI) * 180 - (angle > Math.PI ? 270 : 90)}
    })
  }

  draw() {
    const {colorList} = this.#style
    const arcData = {
      data: this.#arcData.map(({startAngle, endAngle, innerRadius, outerRadius}) => [
        startAngle,
        endAngle,
        innerRadius,
        outerRadius,
      ]),
      position: this.#arcData.map(({position}) => position),
      source: this.#arcData.map(({category, value}) => ({category, value})),
      ...this.#style.arc,
      fill: this.#arcData.map((group, index) => {
        return colorList ? this.setFill(group, index, colorList) : group.color
      }),
    }
    const ribbonData = this.#ribbonData.map((group, index) => ({
      data: group.map(item => item.data),
      position: group.map(item => item.position),
      ...this.#style.ribbon,
      fill: colorList ? this.setFill(group, index, colorList) : group.map(({color}) => color),
    }))
    const textData = {
      data: this.#textData.map(({value}) => value),
      position: this.#textData.map(({x, y}) => [x, y]),
      transformOrigin: this.#textData.map(item => item.transformOrigin),
      rotation: this.#textData.map(({angle}) => angle),
      ...this.#style.text,
    }
    this.drawBasic('arc', [arcData])
    this.drawBasic('path', ribbonData, 'ribbon')
    this.drawBasic('text', [textData])
  }
}

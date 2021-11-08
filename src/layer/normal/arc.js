import LayerBase from '../base'
import Scale from '../../data/scale'

const waveType = {
  PIE: 'pie',
  NIGHTINGALEROSE: 'nightingaleRose',
}

const modeType = {
  DEFAULT: 'default', // cover
  STACK: 'stack',
}

const labelPositionType = {
  INNER: 'inner',
  OUTER: 'outer',
}

const defaultOptions = {
  type: waveType.PIE,
  mode: modeType.DEFAULT,
}

const defaultStyle = {
  innerRadius: 0,
  labelOffset: 5,
  labelPosition: labelPositionType.INNER,
  arc: {},
  text: {},
}

export default class ArcLayer extends LayerBase {
  #data = null

  #scale = {}

  #style = defaultStyle

  #arcData = []

  #textData = []

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
    super({...defaultOptions, ...layerOptions}, waveOptions, ['arc', 'text'])
    const {type, mode} = this.options
    this.className = `wave-${mode}-${type}`
    this.tooltipTargets = ['arc']
  }

  // filter number of columns
  #filter = data => {
    const {type, mode} = this.options
    if (type === waveType.PIE || mode === modeType.DEFAULT) {
      return data.select(data.data.map(({header}) => header).slice(0, 2))
    }
    return data
  }

  setData(tableList, scales) {
    this.#data = this.createData('tableList', this.#data, tableList, this.#filter)
    const {type, mode, layout} = this.options
    const {width, height} = layout
    const headers = this.#data.data.map(({header}) => header)
    const labels = this.#data.select(headers[0])
    const maxRadius = Math.min(width, height) / 2
    this.#scale.scaleAngle = null
    // initialize scales of pie
    if (type === waveType.PIE) {
      const percentages = this.#data.select(headers[1], {mode: 'percentage', target: 'column'})
      this.#scale = this.createScale(
        {
          scaleAngle: new Scale({
            type: 'angle',
            domain: labels.concat(percentages),
            range: [0, 360],
          }),
          scaleRadius: new Scale({
            type: 'quantize',
            domain: [-Infinity, Infinity],
            range: [maxRadius],
          }),
        },
        this.#scale,
        scales
      )
    }
    // initialize scales of nightingaleRose
    if (type === waveType.NIGHTINGALEROSE) {
      const percentages = this.#data.select(headers[1])
      percentages.data[0].list = percentages.data[0].list.map(() => 1 / percentages.data[0].list.length)
      this.#scale = this.createScale(
        {
          scaleAngle: new Scale({
            type: 'angle',
            domain: labels.concat(percentages),
            range: [0, 360],
          }),
          scaleRadius: new Scale({
            type: 'linear',
            domain:
              mode === modeType.STACK
                ? [0, this.#data.select(headers.slice(1), {mode: 'sum', target: 'row'}).range()[1]]
                : [0, this.#data.select(headers.slice(1)).range()[1]],
            range: [0, maxRadius],
          }),
        },
        this.#scale,
        scales
      )
    }
  }

  #getLabelData = ({value, x, y, innerRadius, outerRadius, startAngle, endAngle}) => {
    const {text, labelPosition, labelOffset} = this.#style
    // Calculate the center point of the arc, the svg is drawn clockwise from 90 degrees
    if (labelPosition === labelPositionType.INNER) {
      const [angle, r] = [((startAngle + endAngle) / 360) * Math.PI, (innerRadius + outerRadius) / 2]
      const [centerX, centerY] = [x + Math.sin(angle) * r, y - Math.cos(angle) * r]
      return this.createText({x: centerX, y: centerY, value, style: text, position: 'center'})
    }
    // Calculate the relative position of the label
    if (labelPosition === labelPositionType.OUTER) {
      const [angle, r] = [((startAngle + endAngle) / 360) * Math.PI, outerRadius + labelOffset]
      const [relativeX, relativeY] = [x + Math.sin(angle) * r, y - Math.cos(angle) * r]
      const position = Math.abs(angle % (2 * Math.PI)) < Math.PI ? 'right' : 'left'
      return this.createText({x: relativeX, y: relativeY, value, style: text, position})
    }
    return null
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {type, mode, layout} = this.options
    const {left, top, width, height} = layout
    const {scaleAngle, scaleRadius} = this.#scale
    const {innerRadius, arc} = this.#style
    const headers = this.#data.data.map(({header}) => header)
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const arcCenter = {x: left + width / 2, y: top + height / 2}
    // innerRadius affect the scale
    if (type === waveType.NIGHTINGALEROSE) {
      scaleRadius.range([innerRadius, scaleRadius.range()[1]])
    }
    // basic data of arc
    this.#arcData = pureTableList.map(([dimension, ...values]) => values.map((value, i) => ({
      value,
      dimension,
      category: headers[i + 1],
      innerRadius,
      outerRadius: scaleRadius(value),
      ...scaleAngle(dimension),
      ...arcCenter,
    })))
    // stacked nightingaleRose transformation
    if (mode === modeType.STACK) {
      this.#arcData.forEach(group => group.forEach((item, i) => {
        if (i !== 0) {
          item.innerRadius = group[i - 1].outerRadius
          item.outerRadius = item.innerRadius + item.outerRadius - innerRadius
        }
      }))
    }
    // get colors
    if (this.#arcData[0]?.length > 1) {
      const colorMatrix = this.getColorMatrix(1, this.#arcData[0].length, arc.fill)
      this.#arcData.forEach(group => group.forEach((item, i) => (item.color = colorMatrix.get(0, i))))
      this.#data.set('legendData', {
        colorMatrix,
        filter: 'column',
        list: this.#data.data.slice(1).map(({header}, i) => ({
          shape: 'rect',
          label: header,
          color: colorMatrix.get(0, i),
        })),
      })
    } else if (this.#arcData[0]?.length === 1) {
      const colorMatrix = this.getColorMatrix(this.#arcData.length, 1, arc.fill)
      this.#arcData.forEach((group, i) => (group[0].color = colorMatrix.get(i, 0)))
      this.#data.set('legendData', {
        colorMatrix,
        filter: 'row',
        list: pureTableList.map((item, i) => ({
          shape: 'rect',
          label: item[0],
          color: colorMatrix.get(i, 0),
        })),
      })
    }
    // label data
    this.#textData = this.#arcData.map(group => {
      return group.map(data => this.#getLabelData({...data}))
    })
  }

  draw() {
    const arcData = this.#arcData.map(group => {
      const data = group.map(({startAngle, endAngle, innerRadius, outerRadius}) => [
        startAngle,
        endAngle,
        innerRadius,
        outerRadius,
      ])
      const source = group.map(({dimension, category, value}) => ({dimension, category, value}))
      const position = group.map(({x, y}) => [x, y])
      const fill = group.map(({color}) => color)
      return {data, position, source, ...this.#style.arc, fill}
    })
    const textData = this.#textData.map(group => {
      const data = group.map(({value}) => value)
      const position = group.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('arc', arcData)
    this.drawBasic('text', textData)
  }
}

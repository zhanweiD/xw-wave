// 饼图
import LayerBase from '../base'
import Scale from '../../data/scale'
import {POSITION} from '../../utils/constants'

const CHART = {
  PIE: 'pie',
  NIGHTINGALEROSE: 'nightingaleRose',
}

const MODE = {
  DEFAULT: 'default', // cover
  STACK: 'stack',
}

const defaultOptions = {
  type: CHART.PIE,
  mode: MODE.DEFAULT,
}

const defaultStyle = {
  innerRadius: 0,
  labelOffset: 5,
  labelPosition: POSITION.INNER,
  arc: {},
  text: {},
  unit: {
    showUnit: false,
  },
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

  constructor(layerOptions, chartOptions) {
    super({...defaultOptions, ...layerOptions}, chartOptions, ['arc', 'text', 'gradient'])
    const {type, mode} = this.options
    this.className = `CHART-${mode}-${type}`
    this.tooltipTargets = ['arc']
  }

  // filter number of columns
  #filter = data => {
    const {type, mode} = this.options
    if (type === CHART.PIE || mode === MODE.DEFAULT) {
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
    if (type === CHART.PIE) {
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
    if (type === CHART.NIGHTINGALEROSE) {
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
              mode === MODE.STACK
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
    if (labelPosition === POSITION.INNER) {
      const [angle, r] = [((startAngle + endAngle) / 360) * Math.PI, (innerRadius + outerRadius) / 2]
      const [centerX, centerY] = [x + Math.sin(angle) * r, y - Math.cos(angle) * r]
      return this.createText({x: centerX, y: centerY, value, style: text, position: 'center'})
    }
    // Calculate the relative position of the label
    if (labelPosition === POSITION.OUTER) {
      const [angle, r] = [((startAngle + endAngle) / 360) * Math.PI, outerRadius + labelOffset]
      const [relativeX, relativeY] = [x + Math.sin(angle) * r, y - Math.cos(angle) * r]
      const position = Math.abs(angle % (2 * Math.PI)) < Math.PI ? 'right' : 'left'
      return this.createText({x: relativeX, y: relativeY, value, style: text, position})
    }
    return null
  }

  setStyle(style) {
    const {type, mode, layout, id} = this.options
    this.#style = this.createStyle(defaultStyle, this.#style, style, id, type)

    const {left, top, width, height} = layout
    const {scaleAngle, scaleRadius} = this.#scale
    const {innerRadius, colorList, shape} = this.#style

    const headers = this.#data.data.map(({header}) => header)
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const arcCenter = {x: left + width / 2, y: top + height / 2}
    // innerRadius affect the scale
    if (type === CHART.NIGHTINGALEROSE) {
      scaleRadius.range([innerRadius, scaleRadius.range()[1]])
    }
    // basic data of arc
    this.#arcData = pureTableList.map(([dimension, ...values]) => {
      return values.map((value, i) => ({
        value,
        dimension,
        category: headers[i + 1],
        innerRadius,
        outerRadius: scaleRadius(value),
        ...scaleAngle(dimension),
        ...arcCenter,
      }))
    })
    // stacked nightingaleRose transformation
    if (mode === MODE.STACK) {
      this.#arcData.forEach(group => {
        return group.forEach((item, i) => {
          if (i !== 0) {
            item.innerRadius = group[i - 1].outerRadius
            item.outerRadius = item.innerRadius + item.outerRadius - innerRadius
          }
        })
      })
    }
    // get colors
    if (this.#arcData[0]?.length > 1) {
      const colorMatrix = this.getColorMatrix(1, this.#arcData[0].length, colorList)
      this.#arcData.forEach(group => group.forEach((item, i) => (item.color = colorMatrix.get(0, i))))
      this.#data.set('legendData', {
        colorMatrix,
        filter: 'column',
        list: this.#data.data.slice(1).map(({header}, i) => ({
          shape: shape || 'rect',
          label: header,
          // color: colorMatrix.get(0, i),
          color: ((i < colorList?.length) || !colorList) ? colorMatrix.get(0, i) : colorList?.[colorList?.length - 1],
        })),
      })
    } else if (this.#arcData[0]?.length === 1) {
      const colorMatrix = this.getColorMatrix(this.#arcData.length, 1, colorList)
      this.#arcData.forEach((group, i) => (group[0].color = colorMatrix.get(i, 0)))
      this.#data.set('legendData', {
        colorMatrix,
        filter: 'row',
        list: pureTableList.map((item, i) => ({
          shape: 'rect',
          label: item[0],
          color: ((i < colorList?.length) || !colorList) ? colorMatrix.get(0, i) : colorList?.[colorList?.length - 1],
          // color: colorMatrix.get(i, 0),
        })),
      })
    }
    // label data
    this.#textData = this.#arcData.map(group => {
      return group.map(data => this.#getLabelData({...data}))
    })
  }

  draw() {
    const {colorList} = this.#style
    const arcData = this.#arcData.map((group, index) => ({
      data: group.map(({startAngle, endAngle, innerRadius, outerRadius}) => [
        startAngle,
        endAngle,
        innerRadius,
        outerRadius,
      ]),
      source: group.map(({dimension, category, value}) => ({dimension, category, value})),
      position: group.map(({x, y}) => [x, y]),
      ...this.#style.arc,
      // fill: group.map(({color}) => color),
      fill: colorList ? this.setFill(group, index, colorList) : group.map(({color}) => color),

    }))
    const textData = this.#textData.map(group => ({
      data: group.map(({value}) => value),
      position: group.map(({x, y}) => [x, y]),
      ...this.#style.text,
    }))
    const {unit = {}} = this.#style
    if (unit.showUnit) {
      const unitData = {
        ...unit,
        data: [unit.data],
        position: [unit.offset],
      }
      textData.push(unitData)
    }
    this.drawBasic('arc', arcData)
    this.drawBasic('text', textData)
  }
}

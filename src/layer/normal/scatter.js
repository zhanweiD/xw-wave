import {isNumber} from 'lodash'
import Scale from '../../data/scale'
import LayerBase from '../base'

const defaultStyle = {
  pointSize: [5, 5],
  point: {},
  text: {},
}

export default class ScatterLayer extends LayerBase {
  #data = []

  #scale = {}

  #style = defaultStyle

  #pointData = []

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
    super(layerOptions, waveOptions, ['point', 'text'])
    this.className = 'wave-scatter'
    this.tooltipTargets = ['point']
  }

  // headers of tableList is
  setData(data, scales) {
    this.#data = data || this.#data
    const {left, top, width, height} = this.options.layout
    const headers = this.#data.data.map(({header}) => header)
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const xIndex = headers.findIndex(header => header === 'x')
    const yIndex = headers.findIndex(header => header === 'y')
    const valueIndex = headers.findIndex(header => header === 'value')
    const categoryIndex = headers.findIndex(header => header === 'category')
    // initialize scales
    this.#scale = this.createScale(
      {
        scaleX: new Scale({
          type: 'linear',
          domain: this.#data.select(headers.slice(1, 2)).range(),
          range: [0, width],
        }),
        scaleY: new Scale({
          type: 'linear',
          domain: this.#data.select(headers.slice(2, 3)).range(),
          range: [height, 0],
        }),
      },
      this.#scale,
      scales
    )
    // point data
    const pointData = pureTableList.map((item, i) => ({
      value: item[valueIndex],
      category: item[categoryIndex],
      cx: left + this.#scale.scaleX(item[xIndex]),
      cy: top + this.#scale.scaleY(item[yIndex]),
      source: headers.map((header, j) => ({
        value: pureTableList[i][j],
        category: header,
      })),
    }))
    // group data according the first column
    const categorys = Array.from(new Set(pointData.map(({category}) => category)))
    this.#pointData = new Array(categorys.length).fill(null).map(() => [])
    pointData.forEach(uncategorizedData => {
      const index = categorys.findIndex(category => category === uncategorizedData.category)
      this.#pointData[index].push(uncategorizedData)
    })
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {pointSize, text, point} = this.#style
    // get colors
    const colorMatrix = this.getColorMatrix(this.#pointData.length, 1, point.fill)
    this.#pointData.forEach((group, i) => group.forEach(item => (item.color = colorMatrix.get(i, 0))))
    // inject point size data
    const valueIndex = this.#data.data.findIndex(({header}) => header === 'value')
    const scaleSize = new Scale({
      type: 'linear',
      domain: valueIndex !== -1 ? this.#data.select('value').range() : [],
      range: pointSize.map(value => value / 2),
    })
    this.#pointData.forEach(group => group.forEach(item => {
      item.r = isNumber(item.value) ? scaleSize(item.value) : pointSize[0] / 2
    }))
    // label data
    this.#textData = this.#pointData.map(group => group.map(({cx, cy, value}) => this.createText({
      x: cx,
      y: cy,
      value,
      style: text,
      position: 'center',
    })))
    // legend data of scatter layer
    this.#data.set('legendData', {
      colorMatrix,
      list: this.#pointData.map((group, i) => ({label: group[0].category, color: colorMatrix.get(i, 0)})),
      shape: 'circle',
      filter: 'row',
    })
  }

  draw() {
    const pointData = this.#pointData.map(group => {
      const data = group.map(({r}) => [r, r])
      const position = group.map(({cx, cy}) => [cx, cy])
      const source = group.map(item => item.source)
      const fill = group.map(({color}) => color)
      return {data, source, position, ...this.#style.point, fill}
    })
    const textData = this.#textData.map(group => {
      const position = group.map(({x, y}) => [x, y])
      const data = group.map(({value}) => value)
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('circle', pointData, 'point')
    this.drawBasic('text', textData)
  }
}

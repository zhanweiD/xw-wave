import {isNumber} from 'lodash'
import Scale from '../../data/scale'
import LayerBase from '../base'

const defaultStyle = {
  pointSize: [5, 5],
  point: {},
  text: {},
  unit: {
    showUnit: false,
  },
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

  constructor(layerOptions, chartOptions) {
    super(layerOptions, chartOptions, ['point', 'text', 'gradient'])
    this.className = 'chart-scatter'
    this.tooltipTargets = ['point']
  }

  // headers of tableList is
  setData(tableList, scales) {
    this.#data = this.createData('tableList', this.#data, tableList)
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
    const {id, type} = this.options
    this.#style = this.createStyle(defaultStyle, this.#style, style, id, type)

    const {pointSize, text, colorList, shape} = this.#style
    // get colors
    const colorMatrix = this.getColorMatrix(this.#pointData.length, 1, colorList)
    this.#pointData.forEach((group, i) => group.forEach(item => (item.color = colorMatrix.get(i, 0))))
    // inject point size data
    const valueIndex = this.#data.data.findIndex(({header}) => header === 'value')
    const scaleSize = new Scale({
      type: 'linear',
      domain: valueIndex !== -1 ? this.#data.select('value').range() : [],
      range: pointSize.map(value => value / 2),
    })
    this.#pointData.forEach(group => {
      group.forEach(item => (item.r = isNumber(item.value) ? scaleSize(item.value) : pointSize[0] / 2))
    })
    // label data
    this.#textData = this.#pointData.map(group => {
      return group.map(({cx, cy, value}) => {
        return this.createText({
          x: cx,
          y: cy,
          value,
          style: text,
          position: 'center',
        })
      })
    })
    // legend data of scatter layer
    this.#data.set('legendData', {
      colorMatrix,
      filter: 'row',
      list: this.#pointData.map((group, i) => ({
        shape: shape || 'circle',
        label: group[0].category,
        color: ((i < colorList?.length) || !colorList) ? colorMatrix.get(0, i) : colorList?.[colorList?.length - 1],
      })),
    })
  }

  draw() {
    const {colorList} = this.#style
    const pointData = this.#pointData.map((group, index) => ({
      data: group.map(({r}) => [r, r]),
      position: group.map(({cx, cy}) => [cx, cy]),
      source: group.map(item => item.source),
      ...this.#style.point,
      fill: colorList ? this.setFill(group, index, colorList) : group.map(({color}) => color),
    }))
    const textData = this.#textData.map(group => ({
      position: group.map(({x, y}) => [x, y]),
      data: group.map(({value}) => value),
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
    this.drawBasic('circle', pointData, 'point')
    this.drawBasic('text', textData)
  }
}

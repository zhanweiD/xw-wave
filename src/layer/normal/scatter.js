import Scale from '../../data/scale'
import LayerBase from '../base'

// 默认样式
const defaultStyle = {
  circleSize: [5, 5],
  circle: {},
  text: {},
}

export default class ScatterLayer extends LayerBase {
  #data = []
  
  #scale = {}

  #style = defaultStyle

  #circleData = []

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

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['circle', 'text'])
    this.className = 'wave-scatter'
    this.tooltipTargets = ['circle']
  }

  // 列数据的字段是固定的
  setData(data, scales) {
    this.#data = data || this.#data
    const {left, top, width, height} = this.options.layout
    const headers = this.#data.data.map(({header}) => header)
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const xIndex = headers.findIndex(header => header === 'x')
    const yIndex = headers.findIndex(header => header === 'y')
    const valueIndex = headers.findIndex(header => header === 'value')
    const categoryIndex = headers.findIndex(header => header === 'category')
    // 初始化比例尺
    this.#scale = this.createScale({
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
    }, this.#scale, scales)
    // 计算点的基础数据
    const circleData = pureTableList.map((item, i) => ({
      value: item[valueIndex],
      category: item[categoryIndex],
      cx: left + this.#scale.scaleX(item[xIndex]),
      cy: top + this.#scale.scaleY(item[yIndex]),
      source: headers.map((header, j) => ({
        value: pureTableList[i][j],
        category: header,
      })),
    }))
    // 数据根据第一列的名称分组
    const categorys = Array.from(new Set(circleData.map(({category}) => category)))
    this.#circleData = new Array(categorys.length).fill(null).map(() => [])
    circleData.forEach(uncategorizedData => {
      const index = categorys.findIndex(category => category === uncategorizedData.category)
      this.#circleData[index].push(uncategorizedData)
    })
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {circleSize, text, circle} = this.#style
    // 颜色跟随主题
    const colors = this.getColor(this.#circleData.length, circle.fill)
    this.#circleData.forEach((groupData, i) => groupData.forEach(item => item.color = colors[i]))
    // 圆点大小数据
    const valueIndex = this.#data.data.findIndex(({header}) => header === 'value')
    const scaleSize = new Scale({
      type: 'linear',
      domain: valueIndex !== -1 ? this.#data.select('value').range() : [],
      range: circleSize.map(value => value / 2),
    })
    this.#circleData = this.#circleData.map(groupData => groupData.map(({value, ...others}) => ({
      value,
      rx: value !== undefined ? scaleSize(value) : circleSize[0] / 2,
      ry: value !== undefined ? scaleSize(value) : circleSize[0] / 2,
      ...others,
    })))
    // 标签文字数据
    this.#textData = this.#circleData.map(groupData => groupData.map(({cx, cy, value}) => {
      return this.createText({x: cx, y: cy, value: value || '', style: text, position: 'center'})
    }))
    // 图层自定义图例数据
    this.#data.set('legendData', {
      list: this.#circleData.map((item, i) => ({label: item[0].category, color: colors[i]})),
      shape: 'circle',
      filter: 'row',
    })
  }

  // 绘制
  draw() {
    const circleData = this.#circleData.map(groupData => {
      const data = groupData.map(({rx, ry}) => [rx, ry])
      const position = groupData.map(({cx, cy}) => [cx, cy])
      const source = groupData.map(item => item.source)
      const fill = groupData.map(({color}) => color)
      return {data, source, position, ...this.#style.circle, fill}
    })
    const textData = this.#textData.map(groupData => {
      const position = groupData.map(({x, y}) => [x, y])
      const data = groupData.map(({value}) => value)
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

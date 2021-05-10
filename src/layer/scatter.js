import LayerBase from './base'
import getTextWidth from '../util/text-wdith'
import Scale from '../data/scale'

// 默认样式
const defaultStyle = {
  circleSizeRange: [5, 5],
  circle: {},
  text: {},
}

// 散点气泡层
export default class ScatterLayer extends LayerBase {
  #data = null
  
  #scale = null

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
    super(layerOptions, waveOptions)
    this.className = 'wave-scatter'
  }

  // 列数据依次为：分组名称、x轴坐标值、y轴坐标值、数值（可缺省）
  setData(data) {
    this.#data = data || this.#data
    const {layout} = this.options
    const {left, top, width, height} = layout
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    // 初始化比例尺
    this.#scale = {
      scaleX: new Scale({
        type: 'linear',
        domain: this.#data.select(headers.slice(1, 2)).range(),
        range: [0, width],
      }),
      scaleY: new Scale({
        type: 'linear',
        domain: this.#data.select(headers.slice(2, 3)).range(),
        range: [height, 0],
        nice: {count: 5, zero: true},
      }),
    }
    // 计算点的基础数据
    const circleData = pureTableList.map(([category, x, y, value]) => ({
      category,
      cx: left + this.#scale.scaleX(x),
      cy: top + this.#scale.scaleX(y),
      value,
    }))
    // 数据根据第一列的名称分组
    const categorys = []
    this.#circleData = []
    circleData.forEach(uncategorizedData => {
      const index = categorys.findIndex(category => category === uncategorizedData.category)
      index === -1 ? this.#circleData.push([uncategorizedData]) : this.#circleData[index].push(uncategorizedData)
    })
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {getColor} = this.options
    const {circleSizeRange} = this.#style
    const {fontSize = 12} = this.#style.text
    const scaleSize = new Scale({
      type: 'linear',
      domain: this.#data.data.length >= 4 ? this.#data.select(this.#data.data[3].header).range() : [],
      range: circleSizeRange.map(value => value / 2),
      nice: null,
    })
    // 颜色跟随主题
    const colors = getColor(this.#circleData.length)
    this.#circleData.forEach((groupData, i) => groupData.forEach(item => item.color = colors[i]))
    // 圆点大小数据
    this.#circleData = this.#circleData.map(groupData => {
      return groupData.map(({value, ...others}) => ({
        value,
        ...others,
        rx: value !== undefined ? scaleSize(value) : circleSizeRange[0] / 2,
        ry: value !== undefined ? scaleSize(value) : circleSizeRange[0] / 2,
      }))
    })
    // 标签文字数据
    this.#textData = this.#circleData.map(groupData => groupData.map(({cx, cy, value}) => ({
      x: cx - getTextWidth(value, fontSize) / 2,
      y: cy + fontSize / 2,
      value: value || '',
    })))
  }

  // 绘制
  draw() {
    const circleData = this.#circleData.map(groupData => {
      const data = groupData.map(({rx, ry}) => [rx, ry])
      const position = groupData.map(({cx, cy}) => [cx, cy])
      const source = groupData.map(({category, value, rx, ry}) => ({category, value, x: rx, y: ry}))
      const fill = groupData.map(({color}) => color)
      return {data, source, position, fill, ...this.#style.circle}
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

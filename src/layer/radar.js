import LayerBase from './base'
import Scale from '../data/scale'

// 元素组合方式
const modeType = {
  // 不组合
  DEFAULT: 'default',
  // 组内组合
  STACK: 'stack',
}

// 默认样式
const defaultStyle = {
  pointSize: 4,
  polygon: {
    strokeWidth: 2,
    fillOpacity: 0.4,
  },
  text: {},
}

// 矩形图层
export default class RectLayer extends LayerBase {
  #data = null
  
  #scale = null

  #style = defaultStyle

  #polygonData = []

  #textData = []

  #pointData = []

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
    const {mode = modeType.GROUP} = this.options
    this.className = `wave-${mode}`
  }

  // 传入列表类，第一列数据要求为纬度数据列
  setData(tableList) {
    this.#data = tableList || this.#data
    const {mode = modeType.GROUP, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    const labels = this.#data.data[0].list
    const {width, height, left, top} = layout
    const polygonCenter = {x: left + width / 2, y: top + height / 2}
    const maxRadius = Math.min(width, height) / 2
    // 初始化比例尺
    this.#scale = {
      scaleAngle: new Scale({
        type: 'band',
        domain: labels,
        range: [0, 360],
        nice: {paddingInner: 0},
      }),
      scaleRadius: new Scale({
        type: 'linear',
        domain: mode === modeType.STACK
          ? [0, this.#data.select(headers.slice(1), {mode: 'sum', target: 'row'}).range()[1]]
          : [0, this.#data.select(headers.slice(1)).range()[1]],
        range: [0, maxRadius],
        nice: false,
      }),
    }
    // 根据比例尺计算顶点
    const {scaleAngle, scaleRadius} = this.#scale
    this.#polygonData = pureTableList.map(([dimension, ...values]) => {
      return values.map(value => {
        const [angle, r] = [(scaleAngle(dimension) / 180) * Math.PI, scaleRadius(value)]
        const [x, y] = [polygonCenter.x + Math.sin(angle) * r, polygonCenter.y - Math.cos(angle) * r]
        return ({value, x, y, angle, r, center: polygonCenter})
      })
    })
    // 堆叠雷达图数据变更
    if (mode === modeType.STACK) {
      this.#polygonData = this.#polygonData.map(groupData => {
        return groupData.reduce((prev, cur, index) => {
          return [...prev, {
            ...cur, 
            x: prev[index].x + cur.x - polygonCenter.x,
            y: prev[index].y + cur.y - polygonCenter.y,
          }]
        }, [{x: polygonCenter.x, y: polygonCenter.y}]).slice(1)
      })
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {getColor} = this.options
    const {pointSize = 2} = this.#style
    const {fontSize = 12, format} = this.#style.text
    // 颜色跟随主题
    const colors = getColor(this.#polygonData[0].length)
    this.#polygonData.forEach(groupData => groupData.forEach((item, i) => item.color = colors[i]))
    // 圆点数据依赖多边形数据
    this.#pointData = this.#polygonData.map(groupData => {
      return groupData.map(({x, y, color}) => ({
        cx: x,
        cy: y,
        rx: pointSize / 2,
        ry: pointSize / 2,
        color,
      }))
    })
    // 标签文字数据
    this.#textData = this.#polygonData.map(groupData => groupData.map(({value, x, y, angle}) => {
      const isRight = Math.abs(angle % (2 * Math.PI)) < Math.PI
      return this.createText({value, x, y, fontSize, format, position: isRight ? 'right' : 'left'})
    }))
  }

  // 绘制
  draw() {
    const polygonData = this.#polygonData[0].map(({color, center}, index) => {
      const transformOrigin = [center.x, center.y]
      const data = this.#polygonData.map(item => [item[index].x, item[index].y])
      return {data: [data], fill: color, stroke: color, transformOrigin, ...this.#style.polygon}
    }).reverse()
    const pointData = this.#pointData.map(groupData => {
      const data = groupData.map(({rx, ry}) => [rx, ry])
      const position = groupData.map(({cx, cy}) => [cx, cy])
      const fill = groupData.map(({color}) => color)
      return {data, position, fill, ...this.#style.circle}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('circle', pointData)
    this.drawBasic('polygon', polygonData)
    this.drawBasic('text', textData)
  }
}

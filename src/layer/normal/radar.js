import LayerBase from '../base'
import Scale from '../../data/scale'

// 元素组合方式
const modeType = {
  DEFAULT: 'default', // 覆盖
  STACK: 'stack', // 堆叠
}

// 默认选项
const defaultOptions = {
  mode: modeType.DEFAULT,
}

// 默认样式
const defaultStyle = {
  circleSize: 6,
  circle: {},
  polygon: {
    strokeWidth: 2,
    fillOpacity: 0.4,
  },
  text: {
    hide: true,
  },
}

export default class RadarLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #style = defaultStyle

  #polygonData = []

  #textData = []

  #circleData = []

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
    super({...defaultOptions, ...layerOptions}, waveOptions, ['polygon', 'circle', 'text'])
    const {mode} = this.options
    this.className = `wave-${mode}`
    this.tooltipTargets = ['circle']
  }

  // 传入列表类，第一列数据要求为维度数据列
  setData(tableList, scales) {
    this.#data = tableList || this.#data
    const {mode, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    const labels = this.#data.data[0].list
    const {width, height, left, top} = layout
    const polygonCenter = {x: left + width / 2, y: top + height / 2}
    const maxRadius = Math.min(width, height) / 2
    // 初始化比例尺
    this.#scale = this.createScale({
      scaleAngle: new Scale({
        type: 'band',
        domain: labels,
        range: [0, 360],
      }),
      scaleRadius: new Scale({
        type: 'linear',
        domain: mode === modeType.STACK
          ? [0, this.#data.select(headers.slice(1), {mode: 'sum', target: 'row'}).range()[1]]
          : [0, this.#data.select(headers.slice(1)).range()[1]],
        range: [0, maxRadius],
      }),
    }, this.#scale, scales)
    // 根据比例尺计算顶点
    const {scaleAngle, scaleRadius} = this.#scale
    this.#polygonData = pureTableList.map(([dimension, ...values]) => values.map((value, i) => {
      const [angle, r] = [(scaleAngle(dimension) / 180) * Math.PI, scaleRadius(value)]
      const [x, y] = [polygonCenter.x + Math.sin(angle) * r, polygonCenter.y - Math.cos(angle) * r]
      return ({value, dimension, category: headers[i + 1], x, y, angle, r, center: polygonCenter})
    }))
    // 堆叠雷达图数据变更
    if (mode === modeType.STACK) {
      this.#polygonData.forEach(groupData => groupData.forEach((item, i) => {
        if (i !== 0) {
          item.x = groupData[i - 1].x + item.x - polygonCenter.x
          item.y = groupData[i - 1].y + item.y - polygonCenter.y
        }
      }))
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {circleSize, polygon} = this.#style
    // 颜色跟随主题
    const fillColors = this.getColor(this.#polygonData[0].length, polygon.fill)
    const strokeColors = this.getColor(this.#polygonData[0].length, polygon.stroke)
    this.#polygonData.forEach(groupData => groupData.forEach((item, i) => {
      item.fillColor = fillColors[i]
      item.strokeColor = strokeColors[i]
    }))
    // 圆点数据依赖多边形数据
    this.#circleData = this.#polygonData.map(groupData => {
      return groupData.map(({x, y, ...others}) => ({
        ...others,
        cx: x,
        cy: y,
        rx: circleSize / 2,
        ry: circleSize / 2,
      }))
    })
    // 标签文字数据
    this.#textData = this.#polygonData.map(groupData => groupData.map(({value, x, y, angle}) => {
      const isRight = Math.abs(angle % (2 * Math.PI)) < Math.PI
      return this.createText({value, x, y, style: this.#style.text, position: isRight ? 'right' : 'left'})
    }))
    // 图层自定义图例数据
    this.#data.set('legendData', {
      list: this.#data.data.slice(1).map(({header}, i) => ({label: header, color: fillColors[i]})),
      shape: 'broken-line',
      filter: 'column',
    })
  }

  // 绘制
  draw() {
    const polygonData = this.#polygonData[0].map(({fillColor, strokeColor, center}, index) => {
      const transformOrigin = [center.x, center.y]
      const data = this.#polygonData.map(item => [item[index].x, item[index].y])
      return {data: [data], transformOrigin, ...this.#style.polygon, fill: fillColor, stroke: strokeColor}
    }).reverse()
    const circleData = this.#circleData.map(groupData => {
      const data = groupData.map(({rx, ry}) => [rx, ry])
      const position = groupData.map(({cx, cy}) => [cx, cy])
      const fill = groupData.map(({fillColor}) => fillColor)
      const source = groupData.map(({dimension, category, value}) => ({dimension, category, value}))
      return {data, position, source, ...this.#style.circle, fill}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('polygon', polygonData)
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}
import LayerBase from './base'
import Scale from '../data/scale'

// 映射的图表类型
const waveType = {
  Line: 'line', // 折线图
}

// 元素组合方式
const modeType = {
  DEFAULT: 'default',
  STACK: 'stack',
}

// 文字方向
const labelPositionType = {
  CENTER: 'center',
  TOP: 'top',
  BOTTOM: 'bottom',
  RIGHT: 'right',
  LEFT: 'left',
}

// 默认样式
const defaultStyle = {
  labelPosition: labelPositionType.TOP,
  hasArea: false,
  hasPoint: true,
  line: {},
  text: {},
  point: {},
  area: {},
}

// 矩形图层
export default class LineLayer extends LayerBase {
  #data = null
  
  #scale = null

  #style = defaultStyle

  #lineData = []

  #textData = []

  #pointData = []

  #areaData = []

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
    const {type = waveType.Line, mode = modeType.DEFAULT} = this.options
    this.className = `wave-${mode}-${type}`
  }

  // 传入二维表类，第一列数据要求为纬度数据列
  setData(tableList) {
    this.#data = tableList || this.#data
    const {type = waveType.Line, mode = modeType.DEFAULT, layout} = this.options
    const pureTableList = this.#data.data.map(({list}) => list)
    const label = pureTableList[0]
    pureTableList.shift()
    const headers = this.#data.data.map(({header}) => header)
    // 初始化比例尺
    this.#scale = {
      scaleX: new Scale({
        type: 'point',
        domain: this.#data.select(headers[0]).data[0].list,
        range: type === waveType.Line ? [0, layout.width] : [0, layout.height],
      }),
      scaleY: new Scale({
        type: 'linear',
        domain: this.#data.select(headers.slice(1), {mode: mode === 'stack' && 'sum'}).range(),
        range: type === waveType.Line ? [layout.height, 0] : [0, layout.width],
        nice: {count: 5, zero: true},
      }),
    }
    // 计算基础数据
    const {scaleX, scaleY} = this.#scale
    // 根据比例尺计算原始坐标
    this.#lineData = pureTableList.map(value => {
      return {data: label.map((dimension, index) => ({
        value: value[index],
        x: layout.left + scaleX(dimension),
        y: layout.top + (value[index] > 0 ? scaleY(value[index]) : scaleY(0)),
      }))}
    })
    // 堆叠柱状数据变更
    if (mode === modeType.STACK) {
      const stackData = []
      this.#lineData.reduce((prev, cur) => {
        const result = {data: cur.data.map((item, i) => ({
          value: item.value,
          x: item.x,
          //   y: prev.data[i].y + (layout.height - item.y),
          y: prev.data[i].y - (layout.height + layout.top - item.y),
        }
        ))}
        stackData.push(result)
        return result
      })
      stackData.unshift(this.#lineData[0])
      this.#lineData = stackData
    }
  }

  // 获取标签坐标
  #getLabelData = ({x, y, r, value, fontSize, labelPosition, labelOffset}) => {
    // 计算标签的水平位置
    let positionX
    if (labelPosition === labelPositionType.LEFT) {
      this.#style.text.textAnchor = 'end'
      positionX = x - labelOffset
    } else if (labelPosition === labelPositionType.RIGHT) {
      this.#style.text.textAnchor = 'start'
      positionX = x + labelOffset
    } else {
      positionX = x
    }
    // 计算标签的垂直位置
    let positionY
    if (labelPosition === labelPositionType.TOP) {
      this.#style.text.textAnchor = 'middle'
      positionY = y - r - labelOffset
    } else if (labelPosition === labelPositionType.BOTTOM) {
      this.#style.text.textAnchor = 'middle'
      positionY = y + fontSize + labelOffset
    } else {
      positionY = y + fontSize / 2 - r
    }
    
    return {x: positionX, y: positionY, value: value.toFixed(2)}
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = {...this.#style, ...style}
    const {getColor, layout, mode = modeType.DEFAULT} = this.options
    const {labelPosition, labelOffset = 5} = this.#style
    const {fontSize = 5} = this.#style.text
    const {r = 2} = this.#style.point
    const {curve = true} = this.#style.area
    // 颜色跟随主题
    if (this.#lineData?.length > 0) {
      const colors = getColor(this.#lineData.length)
      this.#lineData.forEach((groupData, i) => {
        groupData.color = colors[i]
      })
    } 
    // 标签文字数据
    this.#textData = this.#lineData.map(groupData => {
      return groupData.data.map(({value, ...data}) => {
        return this.#getLabelData({x: data.x, y: data.y, r, value, fontSize, labelPosition, labelOffset})
      })
    })

    // 点数据
    if (this.#style.hasPoint) {
      this.#style.point.fill = 'white'
      this.#style.point.strokeWidth = 1
      this.#pointData = this.#lineData.map(groupData => ({
        stroke: groupData.color,
        data: groupData.data.map(({value, ...data}) => ({
          ...data,
          r,
        })),
      }))
    }

    // 面积数据
    if (this.#style.hasArea) {
      this.#style.area.opacity = 0.2
      this.#style.area.curve = curve
      this.#areaData = this.#lineData.map((groupData, groupIndex) => ({
        fill: groupData.color,
        stroke: groupData.color,
        data: groupData.data.map(({y, ...d}, index) => ({
          ...d,
          y0: mode === modeType.STACK ? (groupIndex === 0 ? layout.height + layout.top : this.#lineData[groupIndex - 1].data[index].y) : layout.height + layout.top,
          y1: y,
        })),
      }))
    }
  }

  // 绘制
  draw() {
    const lineData = this.#lineData.map(groupData => {
      const position = groupData.data.map(({x, y}) => [x, y])
      const {color} = groupData
      return {position: [position], stroke: [color], ...this.#style.rect}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    const pointData = this.#pointData.map(groupData => {
      const data = groupData.data.map(({r}) => [r, r])
      const position = groupData.data.map(({x, y}) => [x, y])
      const {stroke} = groupData
      return {data, position, stroke, ...this.#style.point}
    })
    const areaData = this.#areaData.map(groupData => {
      const position = groupData.data.map(({x, y0, y1}) => [x, y0, y1])
      const {fill, stroke} = groupData
      return {position: [position], fill: [fill], stroke: [stroke], ...this.#style.area}
    })
    this.drawBasic('area', areaData)
    this.drawBasic('curve', lineData)
    this.drawBasic('circle', pointData)
    this.drawBasic('text', textData)
  }
}

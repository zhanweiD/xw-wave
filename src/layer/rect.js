import LayerBase from './base'
import getTextWidth from '../util/text-wdith'
import Scale from '../data/scale'

// 映射的图表类型
const waveType = {
  COLUMN: 'column', // 柱状图
  BAR: 'bar', // 条形图
}

// 元素组合方式
const modeType = {
  // 不组合
  DEFAULT: 'default',
  // 组内组合
  GROUP: 'group',
  STACK: 'stack',
  INTERVAL: 'interval',
  // 组间组合
  WATERFALL: 'waterfall',
}

// 标签是显示在矩形外部还是矩形内部
const labelPositionType = {
  CENTER: 'center',
  TOPINNER: 'top-inner',
  TOPOUTER: 'top-outer',
  RIGHTINNER: 'right-inner',
  RIGHTOUTER: 'right-outer',
  BOTTOMINNER: 'bottom-inner',
  BOTTOMOUTER: 'bottom-outer',
  LEFTINNER: 'left-inner',
  LEFTOUTER: 'left-outer',
}

// 默认样式
const defaultStyle = {
  labelPosition: labelPositionType.CENTER,
  rect: {},
  text: {},
}

// 矩形图层
export default class RectLayer extends LayerBase {
  #data = null
  
  #scale = null

  #style = defaultStyle

  #rectData = []

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
    const {type = waveType.COLUMN, mode = modeType.GROUP} = this.options
    this.className = `wave-${mode}-${type}`
    this.container = this.options.root.append('g').attr('class', this.className)
  }

  // 传入二维表类，第一列数据要求为纬度数据列
  setData(tableList) {
    this.#data = tableList || this.#data
    const {type = waveType.COLUMN, mode = modeType.GROUP, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    // 初始化比例尺
    this.#scale = {
      scaleX: new Scale({
        type: 'band',
        domain: this.#data.select(headers[0]).data[0].list,
        range: type === waveType.COLUMN ? [0, layout.width] : [0, layout.height],
      }),
      scaleY: new Scale({
        type: 'linear',
        domain: this.#data.select(headers.slice(1), {mode: mode === 'stack' && 'sum'}).range(),
        range: type === waveType.COLUMN ? [layout.height, 0] : [0, layout.width],
        nice: {count: 5, zero: true},
      }),
    }
    // 计算基础数据
    const {scaleX, scaleY} = this.#scale
    const barWidth = scaleX.bandwidth()
    // 由于 svg 坐标系和常规坐标系不同，在引入 bar 比例尺的时候需要进行值域的倒置
    if (type === waveType.BAR) {
      this.#scale.scaleY.range(this.#scale.scaleY.range().reverse())
    }
    // 根据比例尺计算原始坐标和宽高，原始坐标为每个柱子的左上角
    this.#rectData = pureTableList.map(([dimension, ...values]) => {
      return values.map(value => ({
        value,
        x: layout.left + scaleX(dimension),
        y: layout.top + (value > 0 ? scaleY(value) : scaleY(0)),
        width: barWidth,
        height: Math.abs(scaleY(value) - scaleY(0)),
      }))
    })
    // 堆叠柱状数据变更
    if (mode === modeType.STACK) {
      this.#rectData = this.#rectData.map(groupData => {
        return groupData.reduce((prev, cur, index) => {
          return [...prev, {
            ...cur, 
            y: prev[index].y - cur.height,
          }]
        }, [{y: groupData[0].y + groupData[0].height}]).slice(1)
      })
    }
    // 分组柱状数据变更
    if (mode === modeType.GROUP) {
      const columnNumber = this.#rectData[0].length
      this.#rectData = this.#rectData.map(groupData => {
        return groupData.reduce((prev, cur, index) => {
          return [...prev, {
            ...cur, 
            x: prev[index].x + cur.width / columnNumber, 
            width: cur.width / columnNumber,
          }]
        }, [{x: groupData[0].x - groupData[0].width / columnNumber}]).slice(1)
      })
    }
    // 区间柱状数据变更
    if (mode === modeType.INTERVAL) {
      this.#rectData = this.#rectData.map(groupData => {
        const data1 = groupData[0]
        const data2 = groupData[1]
        const [min, max] = [Math.min(data1.value, data2.value), Math.max(data1.value, data2.value)]
        const y = Math.min(data1.y, data2.y)
        const height = Math.abs(data1.y - data2.y)
        return [{...data1, y, height, value: [min, max]}]
      })
    }
    // 瀑布柱状数据变更，最后一列为总值
    if (mode === modeType.WATERFALL) {
      this.#rectData = this.#rectData.reduce((prev, cur) => {
        return [...prev, [{
          ...cur[0],
          y: prev[prev.length - 1][0].y - cur[0].height,
        }]]
      }, [[{y: this.#rectData[0][0].y + this.#rectData[0][0].height}]]).slice(1)
      const {y, height} = this.#rectData[this.#rectData.length - 1][0]
      this.#rectData[this.#rectData.length - 1][0].y = y + height
    }
    // 矩形到条形的数据转换
    if (type === waveType.BAR) {
      const firstRect = this.#rectData[0][0]
      const offset = Array.isArray(firstRect.value) ? Math.abs(scaleY(0) - scaleY(firstRect.value[0])) : 0
      const zeroY = firstRect.y + firstRect.height + offset
      this.#rectData = this.#rectData.map(groupData => {
        return groupData.map(({x, y, height, width, value}) => ({
          value, 
          width: height, 
          height: width,
          y: x - layout.left + layout.top, 
          x: zeroY - height - y + layout.left, 
        }))
      })
    }
  }

  // 获取标签坐标
  #getLabelData = ({x, y, width, height, value, fontSize, labelPosition, labelOffset}) => {
    // 计算标签的水平位置
    let positionX
    if (labelPosition === labelPositionType.LEFTOUTER) {
      positionX = x - getTextWidth(value, fontSize) - labelOffset
    } else if (labelPosition === labelPositionType.LEFTINNER) {
      positionX = x + labelOffset
    } else if (labelPosition === labelPositionType.RIGHTINNER) {
      positionX = x + width - getTextWidth(value, fontSize) - labelOffset
    } else if (labelPosition === labelPositionType.RIGHTOUTER) {
      positionX = x + width + labelOffset
    } else {
      positionX = x + (width - getTextWidth(value, fontSize)) / 2
    }
    // 计算标签的垂直位置
    let positionY
    if (labelPosition === labelPositionType.TOPOUTER) {
      positionY = y - labelOffset
    } else if (labelPosition === labelPositionType.TOPINNER) {
      positionY = y + fontSize
    } else if (labelPosition === labelPositionType.BOTTOMINNER) {
      positionY = y + height - labelOffset
    } else if (labelPosition === labelPositionType.BOTTOMOUTER) {
      positionY = y + height + fontSize + labelOffset
    } else {
      positionY = y + (height / 2) + fontSize / 2
    }
    return {x: positionX, y: positionY, value}
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = {...this.#style, ...style}
    const {getColor} = this.options
    const {labelPosition, labelOffset = 5} = this.#style
    const {fontSize = 12} = this.#style.text
    // 颜色跟随主题
    if (this.#rectData[0]?.length > 1) {
      const colors = getColor(this.#rectData[0].length)
      this.#rectData.forEach(groupData => groupData.forEach((item, i) => item.color = colors[i]))
    } else if (this.#rectData[0]?.length === 1) {
      const colors = getColor(this.#rectData.length)
      this.#rectData.forEach((groupData, i) => (groupData[0].color = colors[i]))
    }
    // 标签文字数据
    this.#textData = this.#rectData.map(groupData => {
      const result = []
      const labelPositionMin = Array.isArray(labelPosition) ? labelPosition[0] : labelPosition
      const labelPositionMax = Array.isArray(labelPosition) ? labelPosition[1] : labelPosition
      groupData.forEach(({value, ...data}) => {
        // value 为区间，对应两个标签
        if (Array.isArray(value)) {
          const [min, max] = value
          result.push(
            this.#getLabelData({...data, value: min, fontSize, labelPosition: labelPositionMin, labelOffset}),
            this.#getLabelData({...data, value: max, fontSize, labelPosition: labelPositionMax, labelOffset}),
          )
        } else {
          result.push(this.#getLabelData({...data, value, fontSize, labelPosition: labelPositionMax, labelOffset}))
        }
      })
      return result
    })
  }

  // 绘制
  draw() {
    const rectData = this.#rectData.map(groupData => {
      const data = groupData.map(({width, height}) => [width, height])
      const position = groupData.map(({x, y}) => [x, y])
      const fill = groupData.map(({color}) => color)
      return {data, position, fill, ...this.#style.rect}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('rect', rectData)
    this.drawBasic('text', textData)
  }
}

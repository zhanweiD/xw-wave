import LayerBase from './base'
import uuid from '../util/uuid'
import needRedraw from '../util/need-redraw'
import getTextWidth from '../util/text-wdith'
import drawText from '../basic/text'
import drawRect from '../basic/rect'

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

const defaultStyle = {
  labelPosition: labelPositionType.OUTER,
  rect: {},
  text: {},
}

// 标题图层
export default class RectLayer extends LayerBase {
  #container = null

  #layout = null

  #data = null
  
  #scale = null

  #style = null

  #rectData = []

  #textData = []
  
  #backup = []

  get layout() {
    return this.#layout
  }

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
    this.className = `wave-rect-${uuid()}`
    this.#container = this.options.root.append('g').attr('class', this.className)
    this.setStyle(defaultStyle)
  }

  // 传入二维表类，第一列数据要求为纬度数据列
  setData(tableList) {
    this.#data = tableList || this.#data
  }

  // 显式传入布局
  setLayout(layout) {
    this.#layout = layout
  }

  // 传入比例尺，矩形图层要求包含 scaleX 和 scaleY
  setScale(scales) {
    this.#scale = {...this.scale, ...scales}
    const {scaleX, scaleY} = this.#scale
    const {left, top} = this.#layout
    const {type = waveType.COLUMN, mode = modeType.GROUP} = this.options
    const tableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const barWidth = scaleX.bandwidth()
    // 由于 svg 坐标系和常规坐标系不同，在引入 bar 比例尺的时候需要进行值域的倒置
    if (scales.scaleY && type === waveType.BAR) {
      this.#scale.scaleY.range(this.#scale.scaleY.range().reverse())
    }
    // 根据比例尺计算原始坐标和宽高，原始坐标为每个柱子的左上角
    this.#rectData = tableList.map(([dimension, ...values]) => {
      return values.map(value => ({
        value,
        x: left + scaleX(dimension),
        y: top + (value > 0 ? scaleY(value) : scaleY(0)),
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
      const zeroY = this.#rectData[0][0].y + this.#rectData[0][0].height
      this.#rectData = this.#rectData.map(groupData => {
        return groupData.map(({x, y, height, width, value}) => ({
          value, 
          width: height, 
          height: width,
          y: x - left + top, 
          x: zeroY - height - y + left, 
        }))
      })
    }
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
    // 计算标签的水平位置
    const getLabelX = ((x, width, text, position) => {
      let result
      if (position === labelPositionType.LEFTOUTER) {
        result = x - getTextWidth(text, fontSize) - labelOffset
      } else if (position === labelPositionType.LEFTINNER) {
        result = x + labelOffset
      } else if (position === labelPositionType.RIGHTINNER) {
        result = x + width - getTextWidth(text, fontSize) - labelOffset
      } else if (position === labelPositionType.RIGHTOUTER) {
        result = x + width + labelOffset
      } else {
        result = x + (width - getTextWidth(text, fontSize)) / 2
      }
      return result
    })
    // 计算标签的垂直位置
    const getLabelY = ((y, height, position) => {
      let result
      if (position === labelPositionType.TOPOUTER) {
        result = y - labelOffset
      } else if (position === labelPositionType.TOPINNER) {
        result = y + fontSize
      } else if (position === labelPositionType.BOTTOMINNER) {
        result = y + height - labelOffset
      } else if (position === labelPositionType.BOTTOMOUTER) {
        result = y + height + fontSize + labelOffset
      } else {
        result = y + (height / 2) + fontSize / 2
      }
      return result
    })
    // 标签文字数据
    this.#textData = this.#rectData.map(groupData => {
      const result = []
      groupData.forEach(({x, y, width, height, value}) => {
        // value 为区间，对应区间柱状图
        if (Array.isArray(value)) {
          const [min, max] = value
          result.push({
            value: min, 
            x: getLabelX(x, width, min, labelPosition), 
            y: getLabelY(y, height, labelPosition),
          })
          result.push({
            value: max, 
            x: getLabelX(x, width, max, labelPosition), 
            y: getLabelY(y, height, labelPosition),
          })
        } else {
          result.push({
            value, 
            x: getLabelX(x, width, value, labelPosition), 
            y: getLabelY(y, height, labelPosition),
          })
        }
      })
      return result
    })
  }

  // 绘制
  draw() {
    for (let i = 0; i < this.#rectData.length; i++) {
      // 矩形
      const groupClassName = `${this.className}-${i}`
      const rectPosition = this.#rectData[i].map(({x, y}) => [x, y])
      const rectSize = this.#rectData[i].map(({width, height}) => [width, height])
      const rectColor = this.#rectData[i].map(({color}) => color)
      const container = this.#container.append('g').attr('class', groupClassName)
      const rectBackup = {
        container,
        data: rectSize,
        position: rectPosition,
        className: `${groupClassName}-rect`,
        fill: rectColor,
        ...this.#style.rect,
      }
      // 文本
      const label = this.#textData[i].map(({value}) => value)
      const textPosition = this.#textData[i].map(({x, y}) => [x, y])
      const textBackup = {
        container,
        data: label,
        position: textPosition,
        className: `${groupClassName}-text`,
        ...this.#style.text,
      }
      // 判断是否进行重新绘制
      if (this.#backup.length <= i || needRedraw(this.#backup[i].rect, rectBackup)) {
        this.#backup[i] = {}
        this.#backup[i].rect = rectBackup
        drawRect(rectBackup)
      }
      if (this.#backup.length <= i || needRedraw(this.#backup[i].text, textBackup)) {
        this.#backup[i] = {}
        this.#backup[i].text = textBackup
        drawText(textBackup)
      }
    }
  }
}

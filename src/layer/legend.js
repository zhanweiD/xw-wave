import {sum, max, range} from 'd3'
import {cloneDeep} from 'lodash'
import LayerBase from './base'
import getTextWidth from '../util/text-width'
import {formatNumber} from '../util/format'

// 对齐方式
const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

// 排列方向
const directionType = {
  HORIZONTAL: 'horizontal', // 水平排列
  VERTICAL: 'vertical', // 垂直排列
}

// 图例形状
const shapeType = {
  RECT: 'rect', // 矩形
  CIRCLE: 'circle', // 圆形
  BROKENLINE: 'broken-line', // 折线
  DOTTEDLINE: 'dotted-line', // 虚线
}

// 默认样式
const defaultStyle = {
  align: alignType.END,
  verticalAlign: alignType.START,
  direction: directionType.HORIZONTAL,
  offset: [0, 0],
  gap: [0, 0],
  shapeSize: 12,
  shape: {},
  text: {
    fill: 'white',
    fontSize: 12,
  },
}

export default class LegendLayer extends LayerBase {
  #data = {
    // 原始数据
    text: [],
    shape: [],
    textColors: [],
    shapeColors: [],
    // 绘制数据
    textData: [],
    rectData: [],
    circleData: [],
    lineData: [],
    // 交互遮罩
    interactiveData: [],
  } 

  #layers = null

  #isFiltering = false

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['text', 'circle', 'rect', 'interactive', 'line'])
    this.className = 'wave-legend'
  }

  // 图例过滤逻辑
  #filter = () => {
    // 备份用于恢复数据
    const colors = cloneDeep(this.#data.shapeColors)
    const originData = cloneDeep(this.#layers.map(layer => layer.data))
    const counts = this.#layers.map(({data}) => data.get('legendData')?.list.length)
    const filterTypes = this.#layers.map(({data}) => data.get('legendData')?.filter)
    const active = new Array(this.#data.shapeColors.length).fill(true)
    const disableColor = '#E2E3E588'
    // 数据筛选
    this.event.off('click-interactive')
    this.event.on('click-interactive', object => {
      const {index} = object.data.source
      const layerIndex = counts.findIndex((v, i) => sum(counts.slice(0, i + 1)) > index)
      const startIndex = counts.slice(0, layerIndex).reduce((prev, cur) => prev + cur, 0)
      const data = originData[layerIndex]
      const layer = this.#layers[layerIndex]
      // 图层需要手动开启过滤支持
      if (!filterTypes[layerIndex]) return
      // 更新图例状态
      if (!active[index]) {
        active[index] = true
        this.#data.shapeColors[index] = colors[index]
        this.#data.textColors[index] = 'white'
      } else {
        active[index] = false
        this.#data.shapeColors[index] = disableColor
        this.#data.textColors[index] = disableColor
      }
      try {
        // 表示当前图层重绘制来自于图例过滤
        this.#isFiltering = true
        let filteredData = data
        // 根据第一列的值过滤行
        if (filterTypes[layerIndex] === 'row') {
          const order = {type: 'row', mapping: {}}
          const mapping = range(startIndex, startIndex + counts[layerIndex]).map(i => active[i])
          filteredData = data.select(data.data.map(({header}) => header))
          filteredData.data.forEach(item => item.list = item.list.filter((v, j) => mapping[j]))
          data.data[0].list.forEach((dimension, i) => order.mapping[dimension] = i)
          filteredData.options.order = order
        }
        // 根据第一行的值过滤列
        if (filterTypes[layerIndex] === 'column') {
          const order = {type: 'column', mapping: {}}
          const subData = data.data.filter((v, i) => (!i || active[startIndex + i - 1]))
          filteredData = data.select(subData.map(({header}) => header))
          data.data.slice(1).map(({header}) => header).forEach((header, i) => order.mapping[header] = i)
          filteredData.options.order = order
        }
        // 更新图层
        layer.setData(filteredData)
        layer.setStyle()
        layer.draw()
        // 更新图例
        this.setStyle()
        this.draw()
      } catch (error) {
        this.warn('图例数据过滤错误\n', error)
      }
    })
  }

  // 更新图层数据并重绘
  #refresh = () => {
    if (!this.#isFiltering) {
      this.setData()
      this.setStyle()
      this.draw()
    }
  }

  /**
   * 传入图例数据
   * @param {Array<LayerBase>} layers 图层数组 
   */
  setData(layers) {
    this.#isFiltering = false
    this.#layers = layers || this.#layers
    // 初始化文字数据和图形颜色
    this.#data.text = []
    this.#data.shape = []
    this.#data.textColors = []
    this.#data.shapeColors = []
    // 图例数据一般由图层自己控制
    this.#layers.forEach(layer => {
      if (layer.data.get('legendData')) {
        const {shape, list} = layer.data.get('legendData')
        this.#data.shape.push(...new Array(list.length).fill(shape))
        this.#data.text.push(...list.map(({label}) => label))
        this.#data.shapeColors.push(...list.map(({color}) => color))
        this.#data.textColors.push(...new Array(list.length).fill('white'))
      } 
    })
    // 生命周期绑定
    if (layers) {
      this.#filter()
      this.#layers.forEach(layer => layer.event.on('draw', this.#refresh))
    }
  }

  // 坐标为文字左侧中点
  #createShape = ({shape, x, y, size, color}) => {
    if (shape === shapeType.RECT) {
      this.#data.rectData.push({
        x: x - size * 2,
        y: y - size / 2,
        width: size * 2,
        height: size,
        fill: color,
      })
    } else if (shape === shapeType.CIRCLE) {
      this.#data.circleData.push({
        cx: x - size / 2,
        cy: y,
        r: size / 2,
        fill: color,
      })
    } else if (shape === shapeType.BROKENLINE) {
      this.#data.lineData.push({
        x1: x - size * 2,
        x2: x - (size / 2) * 3,
        y1: y,
        y2: y,
        strokeWidth: size / 5,
        stroke: color,
      }, {
        x1: x - size / 2,
        x2: x,
        y1: y,
        y2: y,
        strokeWidth: size / 5,
        stroke: color,
      })
      this.#data.circleData.push({
        cx: x - size,
        cy: y,
        r: size / 3,
        strokeWidth: size / 5,
        stroke: color,
      })
    } else if (shape === shapeType.DOTTEDLINE) {
      this.#data.lineData.push({
        x1: x - size * 2,
        x2: x,
        y1: y,
        y2: y,
        stroke: color,
        strokeWidth: size / 5,
        dasharray: `${size / 4} ${size / 4}`,
      })
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {align, verticalAlign, direction, shapeSize, offset, gap} = this.#style
    const {left, top, width, height} = this.options.layout
    const {fontSize, format} = this.#style.text
    const [inner, outer] = gap
    const maxHeight = max([shapeSize, fontSize])
    const shapeWidth = shapeSize * 2
    // 清空衍生数据
    this.#data.rectData = []
    this.#data.circleData = []
    this.#data.lineData = []
    this.#data.textData = []
    // 先确定文字数据
    const textData = this.#data.text.map(value => formatNumber(value, format))
    const textWidths = textData.map(value => getTextWidth(value, fontSize))
    if (direction === directionType.HORIZONTAL) {
      this.#data.textData = textData.map((value, i) => this.createText({
        x: left + (shapeWidth + inner) * (i + 1) + outer * i + sum(textWidths.slice(0, i)),
        y: top + maxHeight / 2,
        style: this.#style.text,
        position: 'right',
        value,
      }))
    } else if (direction === directionType.VERTICAL) {
      this.#data.textData = textData.map((value, i) => this.createText({
        x: left + shapeWidth + inner,
        y: top + maxHeight / 2 + maxHeight * i + outer * i,
        style: this.#style.text,
        position: 'right',
        value,
      }))
    }
    // 根据 align 整体移动文字
    let [totalWidth, totalHeight] = [0, 0]
    if (direction === directionType.HORIZONTAL) {
      const {x, value} = this.#data.textData[this.#data.textData.length - 1]
      totalWidth = x - left + getTextWidth(value, fontSize)
      totalHeight = maxHeight
    } else if (direction === directionType.VERTICAL) {
      const {y} = this.#data.textData[this.#data.textData.length - 1]
      totalWidth = shapeWidth + inner + max(textWidths)
      totalHeight = y - fontSize / 2 + maxHeight / 2 - top
    }
    const [offsetX, offsetY] = [width - totalWidth, height - totalHeight]
    const [isHorizontalMiddle, isHorizontalEnd] = [align === alignType.MIDDLE, align === alignType.END]
    const [isVerticalMiddle, isVerticalEnd] = [verticalAlign === alignType.MIDDLE, verticalAlign === alignType.END]
    this.#data.textData = this.#data.textData.map(({x, y, value}) => ({
      x: x + offset[0] + (isHorizontalMiddle ? offsetX / 2 : isHorizontalEnd ? offsetX : 0),
      y: y + offset[1] + (isVerticalMiddle ? offsetY / 2 : isVerticalEnd ? offsetY : 0),
      value,
    }))
    // 图形固定在文字左侧
    this.#data.shape.forEach((value, i) => this.#createShape({
      shape: value,
      size: shapeSize,
      x: this.#data.textData[i].x - inner,
      y: this.#data.textData[i].y - fontSize / 2,
      color: this.#data.shapeColors[i],
    }))
    // 确定点击区域
    this.#data.interactiveData = this.#data.textData.map(({x, y, value}, i) => ({
      x: x - shapeWidth - inner,
      y: y - fontSize / 2 - maxHeight / 2,
      width: shapeWidth + inner + textWidths[i],
      height: maxHeight,
      source: {value, index: i},
    }))
  }

  draw() {
    const rectData = [{
      data: this.#data.rectData.map(({width, height}) => [width, height]),
      position: this.#data.rectData.map(({x, y}) => [x, y]),
      ...this.#style.shape,
      fill: this.#data.rectData.map(({fill}) => fill),
    }]
    const interactiveData = [{
      data: this.#data.interactiveData.map(({width, height}) => [width, height]),
      position: this.#data.interactiveData.map(({x, y}) => [x, y]),
      source: this.#data.interactiveData.map(({source}) => source),
      fillOpacity: 0,
    }]
    const circleData = [{
      data: this.#data.circleData.map(({r}) => [r, r]),
      position: this.#data.circleData.map(({cx, cy}) => [cx, cy]),
      strokeWidth: this.#data.circleData.map(({strokeWidth}) => strokeWidth),
      ...this.#style.shape,
      fill: this.#data.circleData.map(({fill}) => fill),
      stroke: this.#data.circleData.map(({stroke}) => stroke),
    }]
    const lineData = [{
      data: this.#data.lineData.map(({x1, x2, y1, y2}) => [x1, y1, x2, y2]),
      strokeWidth: this.#data.lineData.map(({strokeWidth}) => strokeWidth),
      dasharray: this.#data.lineData.map(({dasharray}) => dasharray),
      ...this.#style.shape,
      stroke: this.#data.lineData.map(({stroke}) => stroke),
    }]
    const textData = this.#data.textData.map(({value, x, y}, i) => ({
      data: [value],
      position: [[x, y]],
      ...this.#style.text,
      fill: this.#data.textColors[i],
    }))
    this.drawBasic('rect', rectData)
    this.drawBasic('circle', circleData)
    this.drawBasic('line', lineData)
    this.drawBasic('text', textData)
    this.drawBasic('rect', interactiveData, 'interactive')
  }
}

import LayerBase from './base'

// 辅助线方向
const directionType = {
  HORIZONTAL: 'horizontal', // 水平线
  VERTICAL: 'vertical', // 垂直线
}

// 标签位置
const labelPositionType = {
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
}

// 默认选项
const defaultOptions = {
  type: directionType.HORIZONTAL,
}

// 默认样式
const defaultStyle = {
  labelPosition: labelPositionType.RIGHT,
  labelOffset: 5,
  line: {},
  text: {},
}

// 辅助线图层
export default class AuxiliaryLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #style = defaultStyle

  #lineData = []

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
    super({...defaultOptions, ...layerOptions}, waveOptions, ['line', 'text'])
    const {type} = this.options
    this.className = `wave-${type}-auxiliary`
  }

  // 传入数据数组和比例尺，辅助线需要外部的比例尺
  setData(data, scales) {
    this.#data = data || this.#data
    this.#scale = this.createScale({}, this.#scale, scales)
    const {type, layout} = this.options
    const {left, top, width, height} = layout
    const isHorizontal = type === directionType.HORIZONTAL
    const isVertical = type === directionType.VERTICAL
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    // 如没有比例尺不进行计算
    if ((isHorizontal && this.#scale.scaleX) || (isVertical && this.#scale.scaleY)) {
      this.#lineData = pureTableList.map(([label, value]) => ({
        label,
        value,
        x1: left + (isHorizontal ? 0 : this.#scale.scaleX(value)),
        y1: top + (isHorizontal ? this.#scale.scaleY(value) : 0),
        x2: left + (isHorizontal ? width : this.#scale.scaleX(value)),
        y2: top + (isHorizontal ? this.#scale.scaleY(value) : height),
      }))
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {labelPosition = labelPositionType.RIGHT, labelOffset, text} = this.#style
    const [isTop, isBottom, isLeft, isRight] = [
      labelPosition === labelPositionType.TOP,
      labelPosition === labelPositionType.BOTTOM,
      labelPosition === labelPositionType.LEFT,
      labelPosition === labelPositionType.RIGHT,
    ]
    // 标签文字数据
    this.#textData = this.#lineData.map(({value, x1, y1, x2, y2}) => this.createText({
      value,
      x: isLeft ? x1 : isRight ? x2 : (x1 + x2) / 2, 
      y: isTop ? y1 : isBottom ? y2 : (y1 + y2) / 2,
      position: labelPosition,
      offset: labelOffset,
      style: text,
    }))
    // 图层自定义图例数据
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const colors = this.getColor(pureTableList.length, this.#style.line.stroke)
    this.#data.set('legendData', {
      list: pureTableList.map(([label], i) => ({label, color: colors[i]})),
      shape: 'dotted-line',
      canFilter: false,
    })
  }

  // 绘制
  draw() {
    const lineData = [{
      position: this.#lineData.map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
      ...this.#style.line,
    }]
    const textData = [{
      data: this.#textData.map(({value}) => value),
      position: this.#textData.map(({x, y}) => [x, y]),
      ...this.#style.text,
    }]
    this.drawBasic('line', lineData)
    this.drawBasic('text', textData)
  }
}

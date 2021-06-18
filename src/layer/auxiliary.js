import LayerBase from './base'

// 辅助线方向
const directionType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

// 标签位置
const labelPositionType = {
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
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
  
  #scale = null

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
    super(layerOptions, waveOptions)
    const {type = directionType.HORIZONTAL} = this.options
    this.className = `wave-${type}-auxiliary`
  }

  // 传入数据数组和比例尺，辅助线需要外部的比例尺
  setData(data, scale) {
    this.#data = data || this.#data
    this.#scale = scale || this.#scale
    const {type = directionType.HORIZONTAL, layout} = this.options
    const {left, top, width, height} = layout
    // 根据比例尺计算原始坐标
    this.#lineData = this.#data.map(value => ({
      value,
      x1: left + (type === directionType.HORIZONTAL ? 0 : this.#scale.scaleX(value)),
      y1: top + (type === directionType.HORIZONTAL ? this.#scale.scaleY(value) : 0),
      x2: left + (type === directionType.HORIZONTAL ? width : this.#scale.scaleX(value)),
      y2: top + (type === directionType.HORIZONTAL ? this.#scale.scaleY(value) : height),
    }))
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

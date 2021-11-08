import LayerBase from '../base'

const directionType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

const labelPositionType = {
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
}

const defaultOptions = {
  type: directionType.HORIZONTAL,
}

const defaultStyle = {
  labelPosition: labelPositionType.RIGHT,
  labelOffset: 5,
  line: {},
  text: {},
}

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

  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['line', 'text'])
    this.className = `wave-${this.options.type}-auxiliary`
  }

  // the layer needs outside scales
  setData(tableList, scales) {
    this.#data = this.createData('tableList', this.#data, tableList)
    this.#scale = this.createScale({}, this.#scale, scales)
    const {type, layout} = this.options
    const {left, top, width, height} = layout
    const isHorizontal = type === directionType.HORIZONTAL
    const isVertical = type === directionType.VERTICAL
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    // dismiss first call
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

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {labelPosition = labelPositionType.RIGHT, labelOffset, line, text} = this.#style
    const [isTop, isBottom, isLeft, isRight] = [
      labelPosition === labelPositionType.TOP,
      labelPosition === labelPositionType.BOTTOM,
      labelPosition === labelPositionType.LEFT,
      labelPosition === labelPositionType.RIGHT,
    ]
    // label number
    this.#textData = this.#lineData.map(({value, x1, y1, x2, y2}) => this.createText({
      value,
      x: isLeft ? x1 : isRight ? x2 : (x1 + x2) / 2,
      y: isTop ? y1 : isBottom ? y2 : (y1 + y2) / 2,
      position: labelPosition,
      offset: labelOffset,
      style: text,
    }))
    // legend data of auxiliary line layer
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const colorMatrix = this.getColorMatrix(pureTableList.length, 1, line.stroke)
    this.#lineData.forEach((item, i) => (item.color = colorMatrix.get(i, 0)))
    this.#data.set('legendData', {
      colorMatrix,
      filter: 'row',
      list: pureTableList.map(([label], i) => ({
        label,
        shape: 'dotted-line',
        color: colorMatrix.get(i, 0),
      })),
    })
  }

  draw() {
    const lineData = {
      data: this.#lineData.map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
      ...this.#style.line,
      stroke: this.#lineData.map(({color}) => color),
    }
    const textData = {
      data: this.#textData.map(({value}) => value),
      position: this.#textData.map(({x, y}) => [x, y]),
      ...this.#style.text,
    }
    this.drawBasic('line', [lineData])
    this.drawBasic('text', [textData])
  }
}

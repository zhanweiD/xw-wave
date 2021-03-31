import drawCircle from '../basic/circle'
import drawText from '../basic/text'
import LayerBase from './base'
import uuid from '../util/uuid'
import getTextWidth from '../util/text-wdith'
import getTextHeight from '../util/text-height'
import needRedraw from '../util/need-redraw'

// try {
//   const waveLegend = new Wave({container: this._option.container, adjust: 'auto'})
//   const legend = waveLegend.createLayer('legend')
//   legend.data([
//     '图例A',
//     '图例B',
//     '图例C',
//     '图例D',
//     '图例E',
//   ])
//   legend.style({
//     align: 'start',
//     verticalAlign: 'end',
//     gap: [60, 0],
//     text: {
//       fontSize: 22,
//       textShadow: '',
//     },
//     point: {
//       size: 10,
//     },
//   })
//   legend.draw()
// } catch (e) {
//   console.error(e.message)
// }

const defaultStyle = {
  align: 'start', // start | center | right
  verticalAlign: 'start', // start | center | right
  gap: [64, 24],
  size: 10,
  text: {
    fontSize: 22,
    textShadow: '',
  },
  point: {
  },
}
// 标题图层
export default class LegendLayer extends LayerBase {
  #container = null

  #data = []

  #style = null

  #position = null

  #layout = null

  #backup = null

  #colors = []

  get layout() {
    return this.#layout
  }

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    // 初始化默认值
    this.className = `wave-legend-${uuid()}`
    this.#container = this.options.root.append('g').attr('class', this.className)
    this.#data = ['默认图例']
    this.setStyle(defaultStyle)
  }

  // 传入标题文字作为数据
  setData(tableList) {
    this.#data = tableList || this.#data
    this.#colors = this.options.getColor(this.#data.length)
  }

  // 显式传入布局
  setLayout(layout) {
    this.#layout = layout
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = {...this.#style, ...style}
    const {align, verticalAlign, text: {fontSize}} = style
    this.#position = this.#data.map(() => [0, 0])
    const getTextWidthByIndex = index => getTextWidth(this.#data.slice(0, index).join(''), fontSize)

    let {size, gap} = style
    gap && gap[0] ? (size += gap[0]) : (gap = [0, 0]) && (this.#style.gap = [0, 0])

    this.#data.forEach((data, index) => {
      // 水平位置
      switch (align) {
        case 'start':
          this.#position[index][0] = (gap[1] + size * 2) * index + getTextWidthByIndex(index)
          break
        case 'center':
          const fullWidth = getTextWidth(this.#data.length) + (gap[1] + size * 2) * this.#data.length
          this.#position[index][0] = ((gap[1] + size * 2) * index + getTextWidthByIndex(index) + this.#layout.width / 2 - fullWidth / 2)
          break
        case 'end':
          this.#position[index][0] = this.#layout.width - ((gap[1] + size * 2) * index + getTextWidthByIndex(index + 1))
          break
        default:
          break
      }
      // 垂直位置
      switch (verticalAlign) {
        case 'start':
          this.#position[index][1] = getTextHeight(fontSize)
          break
        case 'center':
          this.#position[index][1] = this.#layout.height / 2 - (Math.min(getTextHeight(fontSize), size)) / 2
          break
        case 'end':
          this.#position[index][1] = this.#layout.height - (Math.min(getTextHeight(fontSize), size)) / 2
          break
        default:
          break
      }
    })
  }

  // 调用基础函数绘制图层元素
  draw() {
    const backup = {
      text: [],
      circle: [],
    }
    const {size, gap} = this.#style
    const {top, left, width, height} = this.#layout
    const container = this.#container
      .append('g')
      .attr('width', width)
      .attr('height', height)
      .attr('transform', `translate(${left}, ${top})`)
    // 判断是否进行重新绘制
    if (needRedraw(this.#backup, backup)) {
      this.#backup = backup
      drawCircle({
        container,
        className: `${this.className}-circle`,
        fill: this.#colors,
        data: this.#data.map(() => [size, size]),
        position: this.#position.map(position => ([
          position[0] - size - gap[0],
          position[1] - size / 2,
        ])),
      })
      drawText({
        container,
        className: `${this.className}-text`,
        ...this.#style.text,
        data: this.#data,
        position: this.#position,
      })
    }
  }
}

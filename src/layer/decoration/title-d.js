/* eslint-disable camelcase */
import LayerBase from '../base'
import {createArrow} from '../../util/shape'

const defaultStyle = {
  circleSize: 10,
  mainColor: 'rgb(0,119,255,.5)',
  minorColor: 'rgb(200,200,200,.5)',
  leftIcon: 'arrow', // point
  point: {},
  arrow: {
    strokeWidth: 5,
  },
}

export default class TitleDLayer extends LayerBase {
  #arrowData = []

  #pointData = []

  #style = defaultStyle

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['arrow', 'point'])
    this.className = 'wave-title-d'
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, height, right} = this.options.layout
    const {leftIcon, mainColor, minorColor, circleSize} = this.#style
    const [bigWidth, bigHeight] = [height * 0.35, height * 0.7]
    const [smallWidth, smallHeight] = [height * 0.2, height * 0.4]
    // arrows
    this.#arrowData = leftIcon === 'arrow' ? [{
      points: createArrow(left, top + (height - bigHeight) / 2, bigWidth, bigHeight, 'left'),
      stroke: mainColor,
    }, {
      points: createArrow(left + bigWidth, top + (height - bigHeight) / 2, bigWidth, bigHeight, 'left'),
      stroke: mainColor,
    }] : []
    this.#arrowData.push({
      points: createArrow(right - smallWidth * 2, top + (height - smallHeight) / 2, smallWidth, smallHeight, 'right'),
      stroke: minorColor,
    }, {
      points: createArrow(right - smallWidth, top + (height - smallHeight) / 2, smallWidth, smallHeight, 'right'),
      stroke: minorColor,
    })
    // point
    this.#pointData = leftIcon === 'point' ? [{
      r: circleSize / 2,
      cx: circleSize / 2,
      cy: top + height / 2,
      fill: minorColor,
    }] : []
  }

  draw() {
    const arrowData = [{
      position: this.#arrowData.map(({points}) => points),
      stroke: this.#arrowData.map(({stroke}) => stroke),
      ...this.#style.arrow,
    }]
    const pointData = [{
      position: this.#pointData.map(({cx, cy}) => [cx, cy]),
      data: this.#pointData.map(({r}) => [r, r]),
      fill: this.#pointData.map(({fill}) => fill),
      ...this.#style.point,
    }]
    this.drawBasic('curve', arrowData, 'arrow')
    this.drawBasic('circle', pointData, 'point')
  }
}

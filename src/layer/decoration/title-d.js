/* eslint-disable camelcase */
import LayerBase from '../base'

const defaultStyle = {
  mainColor: 'rgb(0,119,255,.5)',
  minorColor: 'rgb(200,200,200,.5)',
  arrow: {
    strokeWidth: 5,
  },
}

export default class TitleDLayer extends LayerBase {
  #arrowData = []

  #style = defaultStyle

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['arrow'])
    this.className = 'wave-title-d'
  }

  /**
   * create a left arrow which not exceed the area
   * @param {Number} left 
   * @param {Number} top 
   * @param {Number} width 
   * @param {Number} height 
   * @returns {Array<Number} curve points
   */
  #createLeftArrow = (left, top, width, height) => [
    [left + width, top],
    [left, top + height / 2],
    [left + width, top + height],
  ]

  /**
   * create a left arrow which not exceed the area
   * @param {Number} left 
   * @param {Number} top 
   * @param {Number} width 
   * @param {Number} height 
   * @returns {Array<Number} curve points
   */
  #createRightArrow = (left, top, width, height) => [
    [left, top],
    [left + width, top + height / 2],
    [left, top + height],
  ]

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, height, right} = this.options.layout
    const {mainColor, minorColor} = this.#style
    // arrows
    this.#arrowData = [{
      points: this.#createLeftArrow(left, top, height / 2, height),
      stroke: mainColor,
    }, {
      points: this.#createLeftArrow(left + height / 2, top, height / 2, height),
      stroke: mainColor,
    }, {
      points: this.#createRightArrow(right - height / 2, top + height / 4, height / 4, height / 2),
      stroke: minorColor,
    }, {
      points: this.#createRightArrow(right - height / 4, top + height / 4, height / 4, height / 2),
      stroke: minorColor,
    }]
  }

  draw() {
    const arrowData = [{
      position: this.#arrowData.map(({points}) => points),
      stroke: this.#arrowData.map(({stroke}) => stroke),
      ...this.#style.arrow,
    }]
    this.drawBasic('curve', arrowData, 'arrow')
  }
}

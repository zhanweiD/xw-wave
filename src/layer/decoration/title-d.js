import {createArrow} from '../../utils/shape'
import LayerBase from '../base'

const defaultStyle = {
  pointSize: 10,
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

  constructor(layerOptions, chartOptions) {
    super(layerOptions, chartOptions, ['arrow', 'point'])
    this.className = 'chart-title-d'
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, height, right} = this.options.layout
    const {leftIcon, mainColor, minorColor, pointSize, arrow} = this.#style
    const {strokeWidth} = arrow
    // left width & left height
    const [lw, lh] = [height * 0.35, height * 0.7]
    // right width & right height
    const [rw, rh] = [height * 0.2, height * 0.4]
    // arrows
    if (leftIcon === 'arrow') {
      this.#arrowData = [
        {
          points: createArrow(left + strokeWidth, top + (height - lh) / 2, lw, lh, 'left'),
          stroke: mainColor,
        },
        {
          points: createArrow(left + strokeWidth + lw, top + (height - lh) / 2, lw, lh, 'left'),
          stroke: mainColor,
        },
      ]
    } else if (leftIcon === 'point') {
      this.#pointData = [
        {
          r: pointSize / 2,
          cx: pointSize / 2,
          cy: top + height / 2,
          fill: minorColor,
        },
      ]
    }
    this.#arrowData.push(
      {
        points: createArrow(right - strokeWidth - rw * 2, top + (height - rh) / 2, rw, rh, 'right'),
        stroke: minorColor,
      },
      {
        points: createArrow(right - strokeWidth - rw, top + (height - rh) / 2, rw, rh, 'right'),
        stroke: minorColor,
      }
    )
  }

  draw() {
    const arrowData = {
      data: this.#arrowData.map(({points}) => points),
      stroke: this.#arrowData.map(({stroke}) => stroke),
      ...this.#style.arrow,
    }
    const pointData = {
      position: this.#pointData.map(({cx, cy}) => [cx, cy]),
      data: this.#pointData.map(({r}) => [r, r]),
      fill: this.#pointData.map(({fill}) => fill),
      ...this.#style.point,
    }
    this.drawBasic('curve', [arrowData], 'arrow')
    this.drawBasic('circle', [pointData], 'point')
  }
}

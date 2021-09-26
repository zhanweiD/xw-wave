import chroma from 'chroma-js'
import LayerBase from '../base'

const defaultStyle = {
  mainColor: 'rgb(0,119,255)',
  minorColor: 'rgb(200,200,200)',
  circleSize: 4,
  rect: {},
  circle: {},
  line: {
    strokeWidth: 2,
  },
}

export default class TitleCLayer extends LayerBase {
  #rectData = {}

  #lineData = []

  #circleData = []

  #style = defaultStyle

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['circle', 'curve', 'rect'])
    this.className = 'wave-title-c'
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {createGradient, layout} = this.options
    const {left, top, width, height, right, bottom} = layout
    const {circleSize, line, mainColor, minorColor} = this.#style
    // left area
    const [alLeft, alRight, alTop, alBottom] = [
      left + circleSize * 2,
      left + height - circleSize * 2,
      top + circleSize * 2,
      top + height - circleSize * 2,
    ]
    // decoration circle
    this.#circleData = [
      {
        fill: minorColor,
        cx: alLeft,
        cy: alTop,
        r: circleSize / 2,
      },
      {
        fill: minorColor,
        cx: alLeft,
        cy: alBottom,
        r: circleSize / 2,
      },
      {
        fill: minorColor,
        cx: alRight,
        cy: alTop,
        r: circleSize / 2,
      },
      {
        fill: minorColor,
        cx: alRight,
        cy: alBottom,
        r: circleSize / 2,
      },
    ]
    // rect area
    this.#rectData = {
      x: left + height,
      y: top,
      width: width - height,
      height,
      fill: createGradient({
        type: 'linear',
        direction: 'vertical',
        colors: [chroma(mainColor).alpha(0), chroma(mainColor).darken()],
        y1: 0.3,
      }),
    }
    // line below rect
    this.#lineData = {
      points: [
        [left + height, bottom],
        [left + width / 2 + height / 2, bottom - line.strokeWidth],
        [right, bottom],
      ],
      stroke: createGradient({
        type: 'linear',
        direction: 'horizontal',
        colors: [chroma(minorColor).alpha(0), chroma(minorColor), chroma(minorColor).alpha(0)],
      }),
    }
  }

  draw() {
    const circleData = [
      {
        position: this.#circleData.map(({cx, cy}) => [cx, cy]),
        data: this.#circleData.map(({r}) => [r, r]),
        fill: this.#circleData.map(({fill}) => fill),
        ...this.#style.circle,
      },
    ]
    const lineData = [
      {
        data: [this.#lineData.points],
        stroke: this.#lineData.stroke,
        ...this.#style.line,
      },
    ]
    const rectData = [
      {
        data: [[this.#rectData.width, this.#rectData.height]],
        position: [[this.#rectData.x, this.#rectData.y]],
        fill: this.#rectData.fill,
        ...this.#style.rect,
      },
    ]
    this.drawBasic('rect', rectData)
    this.drawBasic('curve', lineData)
    this.drawBasic('circle', circleData)
  }
}

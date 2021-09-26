import * as d3 from 'd3'
import LayerBase from '../base'

const defaultStyle = {
  odLine: {
    fillOpacity: 0,
    strokeWidth: 1,
  },
  flyingObject: {
    path: null,
  },
}

const defaultAnimation = {
  flyingObject: {
    loop: {
      type: 'path',
      path: '.wave-basic-line',
    },
  },
}

export default class ODLineLayer extends LayerBase {
  #data = []

  #scale = {}

  #flyingObjectData = []

  #odLineData = []

  #style = defaultStyle

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
    super(layerOptions, waveOptions, ['line', 'flyingObject', 'text'])
    this.tooltipTargets = ['line']
    this.className = 'wave-odLine'
  }

  // quadratic bezier curve
  #getPath = ({fromX, fromY, toX, toY, arc = 0.5}) => {
    const path = d3.path()
    const [deltaX, deltaY] = [toX - fromX, toY - fromY]
    const theta = Math.atan(deltaY / deltaX)
    const len = (Math.sqrt(deltaX ** 2 + deltaY ** 2) / 2) * arc
    const controlPoint = [
      (fromX + toX) / 2 + len * Math.cos(theta - Math.PI / 2),
      (fromY + toY) / 2 + len * Math.sin(theta - Math.PI / 2),
    ]
    path.moveTo(fromX, fromY)
    path.quadraticCurveTo(controlPoint[0], controlPoint[1], toX, toY)
    return path.toString()
  }

  // tableList
  setData(data, scales) {
    this.#data = data || this.#data
    const headers = this.#data.data.map(({header}) => header)
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const fromXIndex = headers.findIndex(header => header === 'fromX')
    const fromYIndex = headers.findIndex(header => header === 'fromY')
    const toXIndex = headers.findIndex(header => header === 'toX')
    const toYIndex = headers.findIndex(header => header === 'toY')
    // initialize scale
    this.#scale = this.createScale({}, this.#scale, scales)
    const {scaleX, scaleY} = this.#scale
    if (scaleX && scaleY) {
      this.#odLineData = pureTableList.map(d => {
        const [fromX, fromY, toX, toY] = [d[fromXIndex], d[fromYIndex], d[toXIndex], d[toYIndex]]
        const position = {fromX: scaleX(fromX), fromY: scaleY(fromY), toX: scaleX(toX), toY: scaleY(toY)}
        return {
          source: [
            {
              category: 'from',
              value: `(${fromX},${fromY})`,
            },
            {
              category: 'to',
              value: `(${toX},${toY})`,
            },
          ],
          // geo coordinates => svg coordinates
          data: this.#getPath(position),
          position,
        }
      })
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {path} = this.#style.flyingObject
    if (path) {
      // has flying object
      this.#flyingObjectData = this.#odLineData.map(() => ({data: path}))
      // animation for flying object
      this.setAnimation(defaultAnimation)
    }
  }

  draw() {
    const odLineData = [
      {
        data: this.#odLineData.map(({data}) => data),
        source: this.#odLineData.map(({source}) => source),
        ...this.#style.odLine,
      },
    ]
    const flyingObjectData = [
      {
        data: this.#flyingObjectData.map(({data}) => data),
        ...this.#style.flyingObject,
      },
    ]
    this.drawBasic('path', odLineData, 'line')
    this.drawBasic('path', flyingObjectData, 'flyingObject')
  }
}

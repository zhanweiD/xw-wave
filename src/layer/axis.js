import * as d3 from 'd3'
import {merge} from 'lodash'
import Scale from '../data/scale'
import {COORDINATE, POSITION, SCALE_TYPE} from '../utils/constants'
import LayerBase from './base'

const defaultOptions = {
  type: COORDINATE.CARTESIAN,
}

const defaultTickLine = {
  stroke: 'white',
  strokeWidth: 1,
  strokeOpacity: 0.2,
  fillOpacity: 0,
}

const defaultAxisLine = {
  stroke: 'white',
  strokeWidth: 1,
  strokeOpacity: 0.5,
}

const defaultText = {
  fontSize: 12,
  fillOpacity: 0.8,
  offset: [0, -5],
}

const defaultTitle = {
  fontSize: 12,
  fillOpacity: 0.8,
}

const defaultStyle = {
  circle: {},
  titleOffset: 5,
  titlePosition: POSITION.SIDE,
  lineAxisX: defaultAxisLine,
  lineAxisY: defaultAxisLine,
  lineTickX: defaultTickLine,
  lineTickY: defaultTickLine,
  lineAngle: defaultTickLine,
  lineRadius: defaultTickLine,
  textX: defaultText,
  textY: defaultText,
  textYR: defaultText,
  textAngle: defaultText,
  textRadius: defaultText,
  titleX: defaultTitle,
  titleY: defaultTitle,
  titleYR: defaultTitle,
}

/**
 * get position array for the line
 * @param {String} type coordinate type
 * @param {*} targetScale
 * @returns
 */
const getPosition = (type, targetScale) => {
  const position = []
  if (targetScale?.type === 'band' || targetScale?.type === 'point') {
    const needOffset = targetScale.type === 'band' && type === COORDINATE.CARTESIAN
    targetScale.domain().forEach(label => {
      position.push([label, targetScale(label) + (needOffset ? targetScale.bandwidth() / 2 : 0)])
    })
  } else if (targetScale?.type === 'linear') {
    const [min, max] = targetScale.domain()
    d3.range(min, max + 10 ** -8, (max - min) / targetScale.nice.count).forEach(label => {
      position.push([label, targetScale(label)])
    })
  }
  return position
}

export default class AxisLayer extends LayerBase {
  #data = {
    titleX: null,
    titleY: null,
    titleYR: null,
  }

  #scale = {
    nice: {
      // tick number
      count: 5,
      // domain contains 0 or not
      zero: false,
      // inner padding ratio between bands
      paddingInner: 0,
      // absolute inner padding between bands
      fixedPaddingInner: null,
      // absolute band width
      fixedBandWidth: null,
      // only useful when setting fixedPaddingInner and fixedBandWidth
      fixedBoundary: 'start',
    },
  }

  #lineData = {
    lineAxisX: [],
    lineAxisY: [],
    lineTickX: [],
    lineTickY: [],
    lineAngle: [],
    lineRadius: [],
  }

  #textData = {
    // origin
    positionX: [],
    positionY: [],
    positionYR: [],
    // draw data
    textX: [],
    textY: [],
    textYR: [],
    textAngle: [],
    textRadius: [],
    // axis title
    titleX: [],
    titleY: [],
    titleYR: [],
  }

  #style = defaultStyle

  get scale() {
    return this.#scale
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    const lineKey = ['lineAxisX', 'lineTickX', 'lineAxisY', 'lineTickY', 'lineAngle', 'lineRadius']
    const textKey = ['textX', 'textY', 'textYR', 'textAngle', 'textRadius', 'titleX', 'titleY', 'titleYR']
    super({...defaultOptions, ...layerOptions}, waveOptions, [...lineKey, ...textKey])
    this.className = `wave-${this.options.type}-axis`
  }

  // merge scales from different layers
  #merge = scales => {
    const coordinate = this.options.type
    merge(this.#scale.nice, scales.nice)
    SCALE_TYPE.forEach(type => {
      // no define
      if (!scales[type]) return
      // new scale
      if (!this.#scale[type] || coordinate === COORDINATE.GEOGRAPHIC) {
        this.#scale[type] = scales[type]
      }
      // merge scale
      if (coordinate !== COORDINATE.GEOGRAPHIC) {
        if (this.#scale[type].type === 'linear') {
          const [current, incoming] = [this.#scale[type].domain(), scales[type].domain()]
          if (current[0] > current[1] !== incoming[0] > incoming[1]) {
            this.log.warn('Layers scale does not match', {current, incoming})
          } else {
            const isReverse = current[0] > current[1]
            const start = isReverse ? Math.max(current[0], incoming[0]) : Math.min(current[0], incoming[0])
            const end = isReverse ? Math.min(current[1], incoming[1]) : Math.max(current[1], incoming[1])
            this.#scale[type].domain([start, end])
          }
        }
        // nice merged scale: nice function must idempotent
        this.#scale[type] = new Scale({
          type: this.#scale[type].type,
          domain: this.#scale[type].domain(),
          range: this.#scale[type].range(),
          nice: this.#scale.nice,
        })
      }
    })
  }

  setData(data, scales) {
    this.#merge(scales)
    const {type, layout, containerWidth} = this.options
    const {left, top, width, height} = layout
    merge(this.#data, data)
    // clear data
    Object.keys(this.#lineData).map(key => (this.#lineData[key] = []))
    Object.keys(this.#textData).map(key => (this.#textData[key] = []))
    // axis x line and label
    const mappingX = ([label, value]) => ({
      value: label,
      x1: left + value,
      x2: left + value,
      y1: top,
      y2: top + height,
    })
    const positionX = getPosition(type, this.#scale.scaleX).map(mappingX)
    this.#lineData.lineAxisX = positionX.slice(0, 1)
    this.#lineData.lineTickX = positionX.slice(1)
    this.#textData.positionX = positionX
    // axis y line and label
    const mappingY = ([label, value]) => ({
      value: label,
      x1: 0,
      x2: containerWidth,
      y1: top + value,
      y2: top + value,
    })
    const positionY = getPosition(type, this.#scale.scaleY).map(mappingY)
    const positionYR = getPosition(type, this.#scale.scaleYR).map(mappingY)
    this.#lineData.lineAxisY = [...positionY.slice(0, 1), ...positionYR.slice(0, 1)]
    this.#lineData.lineTickY = [...positionY.slice(1), ...positionYR.slice(1)]
    this.#textData.positionY = positionY
    this.#textData.positionYR = positionYR
    // axis angle line and label
    const positionAngle = getPosition(type, this.#scale.scaleAngle)
    const maxRadius = this.#scale.scaleRadius?.range()[1] || Math.max(width / 2, height / 2)
    this.#lineData.lineAngle.push(
      ...positionAngle.map(([label, value]) => ({
        value: label,
        angle: value,
        x1: left + width / 2,
        y1: top + height / 2,
        x2: left + width / 2 + Math.sin((value / 180) * Math.PI) * maxRadius,
        y2: top + height / 2 - Math.cos((value / 180) * Math.PI) * maxRadius,
      }))
    )
    // axis radius circle and label
    const positionRadius = getPosition(type, this.#scale.scaleRadius)
    this.#lineData.lineRadius.push(
      ...positionRadius.map(([label, value]) => ({
        value: label,
        cx: left + width / 2,
        cy: top + height / 2,
        r: value,
      }))
    )
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {titlePosition, titleOffset, titleX, titleY, titleYR, textX, textY, textYR, textAngle, textRadius} = this.#style
    const {layout, containerWidth} = this.options
    const {top, left, width, height, bottom} = layout
    // title of axis x
    if (this.#data.titleX) {
      this.#textData.titleX = [
        this.createText({
          x: left + width / 2,
          // title is at the bottom of label x
          y: bottom - textX.offset[1] + textX.fontSize + titleOffset,
          value: this.#data.titleX,
          style: titleX,
          position: 'bottom',
        }),
      ]
    }
    // title of axis y
    if (this.#data.titleY) {
      this.#textData.titleY = []
      if (titlePosition === POSITION.SIDE) {
        this.#textData.positionY.forEach(item => (item.x1 = titleY.fontSize + titleOffset))
        this.#textData.titleY.push({
          rotation: -90,
          ...this.createText({
            x: titleY.fontSize / 2,
            y: top + height / 2,
            value: this.#data.titleY,
            style: titleY,
            position: 'center',
          }),
        })
      } else if (titlePosition === POSITION.TOP) {
        this.#textData.titleY.push(
          this.createText({
            x: 0,
            y: top - titleOffset,
            value: this.#data.titleY,
            style: titleY,
          })
        )
      }
    }
    if (this.#data.titleYR) {
      this.#textData.titleYR = []
      if (titlePosition === POSITION.SIDE) {
        this.#textData.positionY.forEach(item => (item.x2 = containerWidth - titleYR.fontSize - titleOffset))
        this.#textData.titleYR.push({
          rotation: 90,
          ...this.createText({
            x: containerWidth - titleYR.fontSize / 2,
            y: top + height / 2,
            value: this.#data.titleYR,
            style: titleYR,
            position: 'center',
          }),
        })
      } else if (titlePosition === POSITION.TOP) {
        this.#textData.titleYR.push(
          this.createText({
            x: containerWidth,
            y: top - titleOffset,
            value: this.#data.titleYR,
            style: titleYR,
            position: 'left-top',
          })
        )
      }
    }
    // The label of main x is directly below the axis line
    this.#textData.textX = this.#textData.positionX.map(({value, x2, y2}) => {
      return this.createText({x: x2, y: y2, position: 'bottom', value, style: textX})
    })
    // The label of main y is at the bottom left of the line
    this.#textData.textY = this.#textData.positionY.map(({value, x1, y1}) => {
      const position = this.#scale.scaleY?.type === 'linear' ? 'right-bottom' : 'right'
      return this.createText({x: x1, y: y1, position, value, style: textY})
    })
    // The label of minor y is at the bottom right of the line
    this.#textData.textYR = this.#textData.positionYR.map(({value, x2, y2}) => {
      return this.createText({x: x2, y: y2, position: 'left-bottom', value, style: textYR})
    })
    // The label of angle axis is at the extension of the line
    this.#textData.textAngle = this.#lineData.lineAngle.map(({value, x2, y2, angle}) => {
      const _angle = Math.abs((angle + 360) % 360)
      const [isTop, isBottom, isLeft, isRight] = [_angle === 0, _angle === 180, _angle > 180, _angle < 180]
      const position = isTop ? 'top' : isBottom ? 'bottom' : isLeft ? 'left' : isRight ? 'right' : 'default'
      return this.createText({x: x2, y: y2, position, value, style: textAngle})
    })
    // The label of raidus axis is at the right of the first line
    this.#textData.textRadius = this.#lineData.lineRadius.map(({value, cx, cy, r}) => {
      return this.createText({x: cx, y: cy - r, position: 'right', value, style: textRadius})
    })
  }

  draw() {
    const {type} = this.options
    const {scaleX, scaleY, scaleYR} = this.#scale
    const {lineAxisX, lineAxisY, lineTickX, lineTickY, lineAngle, lineRadius} = this.#lineData
    const {textX, textY, textYR, titleX, titleY, titleYR, textAngle, textRadius} = this.#textData
    const transformLineData = key => [
      {
        data: this.#lineData[key].map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
        ...this.#style[key],
      },
    ]
    const transformRadiusData = key => [
      {
        data: this.#lineData[key].map(({r}) => [r, r]),
        position: this.#lineData[key].map(({cx, cy}) => [cx, cy]),
        ...this.#style[key],
      },
    ]
    const transformTextData = key => [
      {
        data: this.#textData[key].map(({value}) => value),
        position: this.#textData[key].map(({x, y}) => [x, y]),
        rotation: this.#textData[key].map(({rotation}) => rotation),
        transformOrigin: this.#textData[key].map(({transformOrigin}) => transformOrigin),
        ...this.#style[key],
      },
    ]
    if (type === COORDINATE.CARTESIAN) {
      if (scaleX?.type === 'linear') {
        lineAxisX.length && this.drawBasic('line', transformLineData('lineAxisX'), 'lineAxisX')
        lineTickX.length && this.drawBasic('line', transformLineData('lineTickX'), 'lineTickX')
      }
      if (scaleY?.type === 'linear' || scaleYR?.type === 'linear') {
        lineAxisY.length && this.drawBasic('line', transformLineData('lineAxisY'), 'lineAxisY')
        lineTickY.length && this.drawBasic('line', transformLineData('lineTickY'), 'lineTickY')
      }
      textX.length && this.drawBasic('text', transformTextData('textX'), 'textX')
      textY.length && this.drawBasic('text', transformTextData('textY'), 'textY')
      textYR.length && this.drawBasic('text', transformTextData('textYR'), 'textYR')
      titleX.length && this.drawBasic('text', transformTextData('titleX'), 'titleX')
      titleY.length && this.drawBasic('text', transformTextData('titleY'), 'titleY')
      titleYR.length && this.drawBasic('text', transformTextData('titleYR'), 'titleYR')
    } else if (type === COORDINATE.POLAR) {
      lineAngle.length && this.drawBasic('line', transformLineData('lineAngle'), 'lineAngle')
      lineRadius.length && this.drawBasic('circle', transformRadiusData('lineRadius'), 'lineRadius')
      textAngle.length && this.drawBasic('text', transformTextData('textAngle'), 'textAngle')
      textRadius.length && this.drawBasic('text', transformTextData('textRadius'), 'textRadius')
    }
  }
}

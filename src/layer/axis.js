import * as d3 from 'd3'
import {merge} from 'lodash'
import LayerBase, {scaleTypes} from './base'
import Scale from '../data/scale'

const coordinateType = {
  GEOGRAPHIC: 'geographic',
  CARTESIAN: 'cartesian',
  POLAR: 'polar',
}

const defaultOptions = {
  type: coordinateType.CARTESIAN,
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
  fillOpacity: 0.8,
  fontSize: 8,
}

const defaultStyle = {
  circle: {},
  labelOffset: 10,
  lineAxisX: defaultAxisLine,
  lineAxisY: defaultAxisLine,
  lineTickX: defaultTickLine,
  lineTickY: defaultTickLine,
  lineAngle: defaultTickLine,
  lineRadius: defaultTickLine,
  textX: defaultText,
  textY: defaultText,
  textAngle: defaultText,
  textRadius: defaultText,
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
    const needOffset = targetScale.type === 'band' && type === coordinateType.CARTESIAN
    targetScale.domain().forEach(label => {
      position.push([label, targetScale(label) + (needOffset ? targetScale.bandwidth() / 2 : 0)])
    })
  } else if (targetScale?.type === 'linear') {
    const [min, max] = targetScale.domain()
    d3.range(min, max + 10 ** -8, (max - min) / (targetScale.nice.count)).forEach(label => {
      position.push([label, targetScale(label)])
    })
  }
  return position
}

export default class AxisLayer extends LayerBase {
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
    textX: [],
    textY: [],
    // top label for axis x
    textXT: [],
    // right label for axis y
    textYR: [],
    textAngle: [],
    textRadius: [],
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
    const textKey = ['textX', 'textXT', 'textY', 'textYR', 'textAngle', 'textRadius']
    super({...defaultOptions, ...layerOptions}, waveOptions, [...lineKey, ...textKey])
    this.className = `wave-${this.options.type}-axis`
  }

  // merge scales from different layers
  #merge = scales => {
    merge(this.#scale.nice, scales.nice)
    scaleTypes.forEach(type => {
      // no define
      if (!scales[type]) return
      // new scale
      if (!this.#scale[type] || type === 'scalePosition') {
        this.#scale[type] = scales[type]
      }
      // merge scale
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
      if (type !== 'scalePosition') {
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
    // clear data
    Object.keys(this.#lineData).map(key => this.#lineData[key] = [])
    Object.keys(this.#textData).map(key => this.#textData[key] = [])
    // axis x line and label
    const mappingX = ([label, value]) => ({
      value: label,
      x1: left + value,
      x2: left + value,
      y1: top,
      y2: top + height,
    })
    const positionX = getPosition(type, this.#scale.scaleX).map(mappingX)
    const positionXT = getPosition(type, this.#scale.scaleXT).map(mappingX)
    this.#lineData.lineAxisX.push(...positionX.slice(0, 1), ...positionXT.slice(0, 1))
    this.#lineData.lineTickX.push(...positionX.slice(1), ...positionXT.slice(1))
    this.#textData.textX = positionX
    this.#textData.textXT = positionXT
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
    this.#lineData.lineAxisY.push(...positionY.slice(0, 1), ...positionYR.slice(0, 1))
    this.#lineData.lineTickY.push(...positionY.slice(1), ...positionYR.slice(1))
    this.#textData.textY = positionY
    this.#textData.textYR = positionYR
    // axis angle line and label
    const positionAngle = getPosition(type, this.#scale.scaleAngle)
    const maxRadius = this.#scale.scaleRadius?.range()[1] || Math.max(width / 2, height / 2)
    this.#lineData.lineAngle.push(...positionAngle.map(([label, value]) => ({
      value: label,
      angle: value,
      x1: left + width / 2,
      y1: top + height / 2,
      x2: left + width / 2 + Math.sin((value / 180) * Math.PI) * maxRadius,
      y2: top + height / 2 - Math.cos((value / 180) * Math.PI) * maxRadius,
    })))
    // axis radius circle and label
    const positionRadius = getPosition(type, this.#scale.scaleRadius)
    this.#lineData.lineRadius.push(...positionRadius.map(([label, value]) => ({
      value: label,
      cx: left + width / 2,
      cy: top + height / 2,
      r: value,
    })))
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {labelOffset, textX, textY, textAngle, textRadius} = this.#style
    const offset = labelOffset
    // The label of main x is directly below the axis line
    this.#textData.textX = this.#textData.textX.map(({value, x2, y2}) => {
      return this.createText({x: x2, y: y2, position: 'bottom', value, style: textX, offset})
    })
    // The label of minor x is directly above the axis line
    this.#textData.textXT = this.#textData.textXT.map(({value, x1, y1}) => {
      return this.createText({x: x1, y: y1, position: 'top', value, style: textX, offset})
    })
    // The label of main y is at the bottom left of the line
    this.#textData.textY = this.#textData.textY.map(({value, x1, y1}) => {
      const position = this.#scale.scaleY?.type === 'linear' ? 'right-bottom' : 'right'
      return this.createText({x: x1, y: y1, position, value, style: textY})
    })
    // The label of minor y is at the bottom right of the line
    this.#textData.textYR = this.#textData.textYR.map(({value, x2, y2}) => {
      return this.createText({x: x2, y: y2, position: 'left-bottom', value, style: textY})
    })
    // The label of angle axis is at the extension of the line
    this.#textData.textAngle = this.#lineData.lineAngle.map(({value, x2, y2, angle}) => {
      const _angle = Math.abs((angle + 360) % 360)
      const [isTop, isBottom, isLeft, isRight] = [_angle === 0, _angle === 180, _angle > 180, _angle < 180]
      const position = isTop ? 'top' : isBottom ? 'bottom' : isLeft ? 'left' : isRight ? 'right' : 'default'
      return this.createText({x: x2, y: y2, position, value, style: textAngle, offset})
    })
    // The label of raidus axis is at the right of the first line
    this.#textData.textRadius = this.#lineData.lineRadius.map(({value, cx, cy, r}) => {
      return this.createText({x: cx, y: cy - r, position: 'right', value, style: textRadius, offset})
    })
  }

  draw() {
    const {type} = this.options
    const [isCartesian, isPolar] = [type === coordinateType.CARTESIAN, type === coordinateType.POLAR]
    const {scaleX, scaleXT, scaleY, scaleYR} = this.#scale
    const transformLineData = key => [{
      data: this.#lineData[key].map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
      ...this.#style[key],
    }]
    const transformRadiusData = key => [{
      data: this.#lineData[key].map(({r}) => [r, r]),
      position: this.#lineData[key].map(({cx, cy}) => [cx, cy]),
      ...this.#style[key],
    }]
    const transformTextData = (key, style) => [{
      data: this.#textData[key].map(({value}) => value),
      position: this.#textData[key].map(({x, y}) => [x, y]),
      ...this.#style[style || key],
    }]
    if (scaleX?.type === 'linear' || scaleXT?.type === 'linear') {
      isCartesian && this.drawBasic('line', transformLineData('lineAxisX'), 'lineAxisX')
      isCartesian && this.drawBasic('line', transformLineData('lineTickX'), 'lineTickX')
    }
    if (scaleY?.type === 'linear' || scaleYR?.type === 'linear') {
      isCartesian && this.drawBasic('line', transformLineData('lineAxisY'), 'lineAxisY')
      isCartesian && this.drawBasic('line', transformLineData('lineTickY'), 'lineTickY')
    }
    isCartesian && this.drawBasic('text', transformTextData('textX'), 'textX')
    isCartesian && this.drawBasic('text', transformTextData('textY'), 'textY')
    isCartesian && this.drawBasic('text', transformTextData('textXT', 'textX'), 'textXT')
    isCartesian && this.drawBasic('text', transformTextData('textYR', 'textY'), 'textYR')
    isPolar && this.drawBasic('line', transformLineData('lineAngle'), 'lineAngle')
    isPolar && this.drawBasic('circle', transformRadiusData('lineRadius'), 'lineRadius')
    isPolar && this.drawBasic('text', transformTextData('textAngle'), 'textAngle')
    isPolar && this.drawBasic('text', transformTextData('textRadius'), 'textRadius')
  }
}

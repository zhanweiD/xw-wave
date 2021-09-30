import {range} from 'd3'
import LayerBase from '../base'
import Scale from '../../data/scale'

const defaultStyle = {
  step: [2, 10],
  valueGap: 10,
  startAngle: -120,
  endAngle: 120,
  arcWidth: 5,
  tickSize: 10,
  pointerSize: 5,
  arc: {},
  line: {},
  circle: {},
  pointer: {},
  tickText: {},
  labelText: {},
  valueText: {
    offset: [0, -20],
  },
}

export default class GaugeLayer extends LayerBase {
  #data = {}

  #style = defaultStyle

  #arcData = []

  #lineData = []

  #circleData = {}

  #pointerData = {}

  #valueTextData = []

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    const subLayers = ['arc', 'line', 'pointer', 'circle', 'tickText', 'labelText', 'valueText']
    super(layerOptions, waveOptions, subLayers)
    this.className = 'wave-gauge'
  }

  // special data
  setData(data = {}) {
    this.#data.value = data.value
    this.#data.label = data.label
    // check the fragments is legal or not
    if (data.fragments) {
      try {
        data.fragments.forEach(item => {
          const [min, max] = [item[0], item[1]]
          if (min > max) throw new Error('data structure wrong')
        })
        data.fragments.reduce((prev, cur) => {
          if (prev[1] > cur[0]) throw new Error('data structure wrong')
          return cur
        })
        this.#data = {
          ...this.#data,
          fragments: data.fragments,
          minValue: data.fragments[0][0],
          maxValue: data.fragments[data.fragments.length - 1][1],
        }
      } catch (error) {
        this.log.warn(error.message, data)
      }
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, width, height} = this.options.layout
    const {step, arcWidth, valueGap, startAngle, endAngle, pointerSize, tickSize} = this.#style
    const {valueText, tickText, labelText, arc} = this.#style
    const {value, label, minValue, maxValue, fragments} = this.#data
    const maxRadius = Math.min(width, height) / 2
    const colorMatrix = this.getColorMatrix(1, fragments.length, arc.fill)
    const arcCenter = {x: left + width / 2, y: top + height / 2}
    const scaleAngle = new Scale({
      type: 'linear',
      domain: [minValue, maxValue],
      range: [startAngle, endAngle],
    })
    // dot data of pointer
    this.#circleData = {cx: arcCenter.x, cy: arcCenter.y, r: pointerSize / 2}
    // pointer data
    const length = maxRadius - arcWidth - tickSize / 0.618 - (tickText.fontSize || tickSize * 2)
    const pointerAngle = (scaleAngle(value) / 180) * Math.PI
    this.#pointerData = {
      x1: this.#circleData.cx,
      y1: this.#circleData.cy,
      x2: this.#circleData.cx + length * Math.sin(pointerAngle),
      y2: this.#circleData.cy - length * Math.cos(pointerAngle),
    }
    // arc axis curve data
    this.#arcData = fragments.map(([min, max], i) => ({
      ...arcCenter,
      innerRadius: maxRadius - arcWidth,
      outerRadius: maxRadius,
      startAngle: scaleAngle(min),
      endAngle: scaleAngle(max),
      color: colorMatrix.get(0, i),
    }))
    // arc axis tick data width label data
    this.#lineData = range(minValue, maxValue + 1, step[0]).map((number, i) => {
      const isBigTick = (i * step[0]) % step[1] === 0 && step[0] !== step[1]
      const angle = (scaleAngle(number) / 180) * Math.PI
      const isLeft = (angle + 2 * Math.PI) % (2 * Math.PI) > Math.PI
      const isRight = (angle + 2 * Math.PI) % (2 * Math.PI) < Math.PI
      const computeX = r => arcCenter.x + Math.sin(angle) * r
      const computeY = r => arcCenter.y - Math.cos(angle) * r
      const innerRadius = maxRadius - arcWidth - (isBigTick ? tickSize / 0.618 : tickSize)
      const outerRadius = maxRadius - arcWidth - 5
      const [x1, y1] = [computeX(innerRadius), computeY(innerRadius)]
      const [x2, y2] = [computeX(outerRadius), computeY(outerRadius)]
      // tick label data
      const tickTextData = isBigTick
        && this.createText({
          x: computeX(innerRadius - tickSize),
          y: computeY(innerRadius - tickSize),
          value: number,
          position: 'center',
          style: tickText,
        })
      // find the fragment if it is the center of arc
      const fragment = fragments.find(([min, max]) => {
        const offsetNumber = (min + max) / 2 - number
        return offsetNumber < step[0] && offsetNumber >= 0
      })
      // fragment label data
      const labelTextData = fragment
        && this.createText({
          x: computeX(maxRadius + (labelText?.fontSize || 12)),
          y: computeY(maxRadius + (labelText?.fontSize || 12)),
          value: fragment[2],
          position: isLeft ? 'left' : isRight ? 'right' : 'center',
          style: labelText,
        })
      return {number, x1, y1, x2, y2, labelTextData, tickTextData}
    })
    // pointer label data
    const [x, y] = [arcCenter.x, arcCenter.y + valueGap + valueText.fontSize]
    this.#valueTextData = [
      this.createText({value, position: 'center', ...arcCenter, style: valueText}),
      this.createText({value: label, position: 'center', x, y, style: valueText}),
    ]
  }

  draw() {
    const arcData = this.#arcData.map(item => {
      const {x, y, startAngle, endAngle, innerRadius, outerRadius, color} = item
      const data = [[startAngle, endAngle, innerRadius, outerRadius]]
      const position = [[x, y]]
      return {data, position, ...this.#style.arc, fill: color}
    })
    const pointerData = [
      {
        data: [[this.#pointerData.x1, this.#pointerData.y1, this.#pointerData.x2, this.#pointerData.y2]],
        ...this.#style.pointer,
      },
    ]
    const circleData = [
      {
        data: [[this.#circleData.r, this.#circleData.r]],
        position: [[this.#circleData.cx, this.#circleData.cy]],
        ...this.#style.circle,
      },
    ]
    const lineData = [
      {
        data: this.#lineData.map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
        ...this.#style.line,
      },
    ]
    const labelText = this.#lineData
      .map(
        ({labelTextData}) => labelTextData && {
          data: [labelTextData.value],
          position: [[labelTextData.x, labelTextData.y]],
          ...this.#style.labelText,
        }
      )
      .filter(Boolean)
    const tickText = this.#lineData
      .map(
        ({tickTextData}) => tickTextData && {
          data: [tickTextData.value],
          position: [[tickTextData.x, tickTextData.y]],
          ...this.#style.tickText,
        }
      )
      .filter(Boolean)
    const valueText = this.#valueTextData.map(({x, y, value}) => ({
      data: [value],
      position: [[x, y]],
      ...this.#style.valueText,
    }))
    this.drawBasic('arc', arcData)
    this.drawBasic('line', lineData)
    this.drawBasic('circle', circleData)
    this.drawBasic('line', pointerData, 'pointer')
    this.drawBasic('text', tickText, 'tickText')
    this.drawBasic('text', labelText, 'labelText')
    this.drawBasic('text', valueText, 'valueText')
  }
}

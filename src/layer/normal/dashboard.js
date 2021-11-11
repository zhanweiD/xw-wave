import {range} from 'd3'
import LayerBase from '../base'
import Scale from '../../data/scale'

const defaultStyle = {
  step: [2, 10],
  startAngle: -120,
  endAngle: 120,
  arcWidth: 5,
  arc: {},
  tickSize: 10,
  tickLine: {},
  tickText: {},
  pointerAnchor: {},
  pointer: {
    strokeWidth: 2,
  },
  labelText: {},
  valueGap: 10,
  valueText: {
    offset: [0, -20],
  },
}

export default class DashboardLayer extends LayerBase {
  #data = null

  #style = defaultStyle

  #arcData = []

  #circleData = {}

  #pointerData = {}

  #tickLineData = []

  #valueTextData = []

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, chartOptions) {
    const subLayers = ['arc', 'pointer', 'pointerAnchor', 'tickLine', 'tickText', 'labelText', 'valueText']
    super(layerOptions, chartOptions, subLayers)
    this.className = 'chart-dashboard'
  }

  setData(data) {
    this.#data = this.createData('base', this.#data, data)
    const {fragments} = this.#data.data
    // check the fragments is legal or not
    if (fragments) {
      try {
        fragments.forEach(item => {
          const [min, max] = [item[0], item[1]]
          if (min > max) throw new Error('Data structure wrong')
        })
        fragments.reduce((prev, cur) => {
          if (prev[1] > cur[0]) throw new Error('Data structure wrong')
          return cur
        })
        this.#data.data = {
          ...this.#data.data,
          minValue: fragments[0][0],
          maxValue: fragments[fragments.length - 1][1],
        }
      } catch (error) {
        this.log.warn(error.message, data)
      }
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, width, height} = this.options.layout
    const {step, arcWidth, valueGap, startAngle, endAngle, tickSize, pointer} = this.#style
    const {valueText, tickText, labelText, arc} = this.#style
    const {value, label, minValue, maxValue, fragments} = this.#data.data
    const maxRadius = Math.min(width, height) / 2
    const colorMatrix = this.getColorMatrix(1, fragments.length, arc.fill)
    const arcCenter = {x: left + width / 2, y: top + height / 2}
    const scaleAngle = new Scale({
      type: 'linear',
      domain: [minValue, maxValue],
      range: [startAngle, endAngle],
    })
    // pointer anchor
    this.#circleData = {cx: arcCenter.x, cy: arcCenter.y, r: pointer.strokeWidth * 2}
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
    this.#tickLineData = range(minValue, maxValue + 1, step[0]).map((number, i) => {
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
      const result = {number, x1, y1, x2, y2}
      if (isBigTick) {
        result.tickTextData = this.createText({
          x: computeX(innerRadius - tickSize),
          y: computeY(innerRadius - tickSize),
          value: number,
          position: 'center',
          style: tickText,
        })
      }
      // find the fragment if it is the center of arc
      const fragment = fragments.find(([min, max]) => {
        const offsetNumber = (min + max) / 2 - number
        return offsetNumber < step[0] && offsetNumber >= 0
      })
      // fragment label data
      if (fragment) {
        result.labelTextData = this.createText({
          x: computeX(maxRadius + (labelText?.fontSize || 12)),
          y: computeY(maxRadius + (labelText?.fontSize || 12)),
          value: fragment[2],
          position: isLeft ? 'left' : isRight ? 'right' : 'center',
          style: labelText,
        })
      }
      return result
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
    const pointerData = {
      data: [[this.#pointerData.x1, this.#pointerData.y1, this.#pointerData.x2, this.#pointerData.y2]],
      ...this.#style.pointer,
    }
    const pointerAnchorData = {
      data: [[this.#circleData.r, this.#circleData.r]],
      position: [[this.#circleData.cx, this.#circleData.cy]],
      ...this.#style.pointerAnchor,
    }
    const tickLineData = {
      data: this.#tickLineData.map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
      ...this.#style.tickLine,
    }
    const labelText = this.#tickLineData.map(({labelTextData}) => {
      return (
        labelTextData && {
          data: [labelTextData.value],
          position: [[labelTextData.x, labelTextData.y]],
          ...this.#style.labelText,
        }
      )
    })
    const tickText = this.#tickLineData.map(({tickTextData}) => {
      return (
        tickTextData && {
          data: [tickTextData.value],
          position: [[tickTextData.x, tickTextData.y]],
          ...this.#style.tickText,
        }
      )
    })
    const valueText = this.#valueTextData.map(({x, y, value}) => ({
      data: [value],
      position: [[x, y]],
      ...this.#style.valueText,
    }))
    this.drawBasic('arc', arcData)
    this.drawBasic('line', [tickLineData], 'tickLine')
    this.drawBasic('line', [pointerData], 'pointer')
    this.drawBasic('circle', [pointerAnchorData], 'pointerAnchor')
    this.drawBasic('text', tickText.filter(Boolean), 'tickText')
    this.drawBasic('text', labelText.filter(Boolean), 'labelText')
    this.drawBasic('text', valueText, 'valueText')
  }
}

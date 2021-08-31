import {range} from 'd3'
import LayerBase from '../base'
import Scale from '../../data/scale'

// 默认样式
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

  // 仪表盘的数据为对象
  setData(data = {}) {
    this.#data.value = data.value
    this.#data.label = data.label
    // 校验 fragments 是否合法
    if (data.fragments) {
      try {
        data.fragments.forEach(item => {
          const [min, max] = [item[0], item[1]]
          if (min > max) throw new Error('数据格式错误')
        })
        data.fragments.reduce((prev, cur) => {
          if (prev[1] > cur[0]) throw new Error('数据格式错误')
          return cur
        })
        this.#data = {
          ...this.#data,
          fragments: data.fragments,
          minValue: data.fragments[0][0], 
          maxValue: data.fragments[data.fragments.length - 1][1],
        }
      } catch (error) {
        this.warn(error.message, data)
      }
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top, width, height} = this.options.layout
    const {step, arcWidth, valueGap, startAngle, endAngle, pointerSize, tickSize} = this.#style
    const {valueText, tickText, labelText, arc} = this.#style
    const {value, label, minValue, maxValue, fragments} = this.#data
    const maxRadius = Math.min(width, height) / 2
    const colors = this.getColor(fragments.length, arc.fill)
    const arcCenter = {x: left + width / 2, y: top + height / 2}
    const scaleAngle = new Scale({
      type: 'linear',
      domain: [minValue, maxValue],
      range: [startAngle, endAngle],
    })
    // 指针圆点数据
    this.#circleData = {cx: arcCenter.x, cy: arcCenter.y, rx: pointerSize / 2, ry: pointerSize / 2}
    // 指针矩形数据
    const length = maxRadius - arcWidth - tickSize / 0.618 - (tickText.fontSize || tickSize * 2)
    const pointerAngle = (scaleAngle(value) / 180) * Math.PI
    this.#pointerData = {
      x1: this.#circleData.cx,
      y1: this.#circleData.cy,
      x2: this.#circleData.cx + length * Math.sin(pointerAngle),
      y2: this.#circleData.cy - length * Math.cos(pointerAngle),
    }
    // 弧形坐标轴弧线数据
    this.#arcData = fragments.map(([min, max], i) => ({
      ...arcCenter,
      innerRadius: maxRadius - arcWidth,
      outerRadius: maxRadius,
      startAngle: scaleAngle(min),
      endAngle: scaleAngle(max),
      color: colors[i],
    }))
    // 弧形坐标轴刻度数据（附加文本坐标数据）
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
      // 刻度标签数据
      const tickTextData = isBigTick && this.createText({
        x: computeX(innerRadius - tickSize),
        y: computeY(innerRadius - tickSize),
        value: number,
        position: 'center',
        style: tickText,
      })
      // 找分类的中心点
      const fragment = fragments.find(([min, max]) => {
        const offsetNumber = (min + max) / 2 - number
        return offsetNumber < step[0] && offsetNumber >= 0
      })
      // 分类标签数据
      const labelTextData = fragment && this.createText({
        x: computeX(maxRadius + (labelText?.fontSize || 12)),
        y: computeY(maxRadius + (labelText?.fontSize || 12)),
        value: fragment[2],
        position: isLeft ? 'left' : isRight ? 'right' : 'center',
        style: labelText,
      })
      return {number, x1, y1, x2, y2, labelTextData, tickTextData}
    })
    // 数值文字数据
    const [x, y] = [arcCenter.x, arcCenter.y + valueGap + valueText.fontSize]
    this.#valueTextData = [
      this.createText({value, position: 'center', ...arcCenter, style: valueText}),
      this.createText({value: label, position: 'center', x, y, style: valueText}),
    ]
  }

  draw() {
    const pointerData = [{
      position: [[this.#pointerData.x1, this.#pointerData.y1, this.#pointerData.x2, this.#pointerData.y2]],
      ...this.#style.pointer,
    }]
    const circleData = [{
      data: [[this.#circleData.rx, this.#circleData.ry]],
      position: [[this.#circleData.cx, this.#circleData.cy]],
      ...this.#style.circle,
    }]
    const arcData = this.#arcData.map(item => {
      const {x, y, startAngle, endAngle, innerRadius, outerRadius, color} = item
      const data = [[startAngle, endAngle, innerRadius, outerRadius]]
      const position = [[x, y]]
      return {data, position, ...this.#style.arc, fill: color}
    })
    const lineData = [{
      position: this.#lineData.map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
      ...this.#style.line,
    }]
    const labelText = this.#lineData.map(({labelTextData}) => labelTextData && ({
      data: [labelTextData.value],
      position: [[labelTextData.x, labelTextData.y]],
      ...this.#style.labelText,
    })).filter(Boolean)
    const tickText = this.#lineData.map(({tickTextData}) => tickTextData && ({
      data: [tickTextData.value],
      position: [[tickTextData.x, tickTextData.y]],
      ...this.#style.tickText,
    })).filter(Boolean)
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

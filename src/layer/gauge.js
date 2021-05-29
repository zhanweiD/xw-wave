import {range} from 'd3'
import LayerBase from './base'
import Scale from '../data/scale'

// 默认样式
const defaultStyle = {
  step: [2, 10],
  startAngle: -120,
  endAngle: 120,
  arcWidth: 5,
  offset: 10,
  tickSize: 10,
  pointerSize: 5,
  line: {},
  rect: {},
  circle: {},
  tickText: {},
  labelText: {},
  valueText: {},
}

// 仪表盘层
export default class GaugeLayer extends LayerBase {
  #data = {}

  #style = defaultStyle

  #arcData = []

  #rectData = {}

  #circleData = {}

  #lineData = []

  #valueTextData = []

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    this.className = 'wave-gauge'
  }

  // 仪表盘的数据为对象
  setData(data = {}) {
    this.#data.value = data.value || this.#data.value
    this.#data.label = data.label || this.#data.label
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
      } catch (e) {
        this.warn(e.message, data)
      }
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {getColor, layout} = this.options
    const {left, top, width, height} = layout
    const {step, arcWidth, offset, startAngle, endAngle, pointerSize, tickSize, valueText, tickText} = this.#style
    const {value, label, minValue, maxValue, fragments} = this.#data
    const maxRadius = Math.min(width, height) / 2
    const colors = getColor(fragments.length)
    const arcCenter = {x: left + width / 2, y: top + height / 2}
    const scaleAngle = new Scale({
      type: 'linear',
      domain: [minValue, maxValue],
      range: [startAngle, endAngle],
      nice: null,
    })
    // 指针圆点数据
    this.#circleData = {cx: arcCenter.x, cy: arcCenter.y, rx: pointerSize / 2, ry: pointerSize / 2}
    // 指针矩形数据
    this.#rectData = {
      width: pointerSize / 4,
      height: maxRadius - arcWidth - tickSize / 0.618 - (tickText.fontSize || tickSize * 2),
      x: arcCenter.x - pointerSize / 8,
      y: arcCenter.y,
      rotate: scaleAngle(value) + 180,
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
        ...this.#style.tickText,
      })
      // 找分类的中心点
      const fragment = fragments.find(([min, max]) => {
        const offsetNumber = (min + max) / 2 - number
        return offsetNumber < step[0] && offsetNumber >= 0
      })
      // 分类标签数据
      const labelTextData = fragment && this.createText({
        x: computeX(maxRadius + (this.#style.labelText?.fontSize || 12)),
        y: computeY(maxRadius + (this.#style.labelText?.fontSize || 12)),
        value: fragment[2],
        position: isLeft ? 'left' : isRight ? 'right' : 'center',
        ...this.#style.labelText,
      })
      return {number, x1, y1, x2, y2, labelTextData, tickTextData}
    })
    // 数值文字数据
    const titleOffset = offset + (valueText.fontSize || 12) + 5
    this.#valueTextData = [
      this.createText({value, position: 'bottom', offset, ...arcCenter, ...valueText}),
      this.createText({value: label, position: 'bottom', offset: titleOffset, ...arcCenter, ...valueText}),
    ]
  }

  draw() {
    const rectData = [{
      data: [[this.#rectData.width, this.#rectData.height]],
      position: [[this.#rectData.x, this.#rectData.y]],
      rotate: this.#rectData.rotate,
      transformOrigin: 'top',
      ...this.#style.rect,
    }]
    const circleData = [{
      data: [[this.#circleData.rx, this.#circleData.ry]],
      position: [[this.#circleData.cx, this.#circleData.cy]],
      ...this.#style.rect,
    }]
    const arcData = this.#arcData.map(item => {
      const {x, y, startAngle, endAngle, innerRadius, outerRadius, color} = item
      const data = [[startAngle, endAngle, innerRadius, outerRadius]]
      const position = [[x, y]]
      return {data, position, fill: color, ...this.#style.arc}
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
    this.drawBasic('circle', circleData)
    this.drawBasic('rect', rectData)
    this.drawBasic('arc', arcData)
    this.drawBasic('line', lineData)
    this.drawBasic('text', labelText.concat(tickText, valueText))
  }
}

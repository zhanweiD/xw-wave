import {range} from 'd3'
import LayerBase from './base'
import Scale from '../data/scale'

// 默认样式
const defaultStyle = {
  step: [2, 10],
  startAngle: -120,
  endAngle: 120,
  arcWidth: 5,
  offset: 5,
  valueOffset: 10,
  labelText: {},
  tickText: {},
  titleText: {},
}

// 仪表盘层
export default class GaugeLayer extends LayerBase {
  #data = {}

  #style = defaultStyle

  #arcData = []

  #basicData = []

  #titleTextData = []

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    this.className = 'wave-text'
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
    const {step, arcWidth, startAngle, endAngle} = this.#style
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
    this.#basicData = range(minValue, maxValue + 1, step[0]).map((number, i) => {
      const isBigTick = (i * step[0]) % step[1] === 0 && step[0] !== step[1]
      const angle = (scaleAngle(number) / 180) * Math.PI
      const computeX = r => arcCenter.x + Math.sin(angle) * r
      const computeY = r => arcCenter.y - Math.cos(angle) * r
      const innerRadius = maxRadius - arcWidth - (isBigTick ? 10 / 0.618 : 10)
      const outerRadius = maxRadius - arcWidth - 5
      const [x1, y1] = [computeX(innerRadius), computeY(innerRadius)]
      const [x2, y2] = [computeX(outerRadius), computeY(outerRadius)]
      // 刻度标签数据
      const tickText = isBigTick && this.createText({
        x: computeX(innerRadius - 10),
        y: computeY(innerRadius - 10),
        value: number,
        position: 'center',
        ...this.#style.tickText,
      })
      // 找分类的中心点
      const fragment = fragments.find(([min, max]) => {
        return number === Math.round((min + max) / 2) || number === Math.round((min + max + 1) / 2)
      })
      // 分类标签数据
      const labelText = fragment && this.createText({
        x: computeX(outerRadius + 20),
        y: computeY(outerRadius + 20),
        value: fragment[2],
        position: 'center',
        ...this.#style.labelText,
      })
      return {number, x1, y1, x2, y2, labelText, tickText}
    })
    // 数值文字数据
    this.#titleTextData = [
      this.createText({value, position: 'bottom', offset: 10, ...arcCenter, ...this.#style.titleText}),
      this.createText({value: label, position: 'bottom', offset: 30, ...arcCenter, ...this.#style.titleText}),
    ]
  }

  draw() {
    const arcData = this.#arcData.map(item => {
      const {x, y, startAngle, endAngle, innerRadius, outerRadius, color} = item
      const data = [[startAngle, endAngle, innerRadius, outerRadius]]
      const position = [[x, y]]
      return {data, position, fill: color, ...this.#style.arc}
    })
    const basicData = [{
      position: this.#basicData.map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
      ...this.#style.line,
    }]
    const fragmentTextData = this.#basicData.map(({labelText}) => labelText && ({
      data: [labelText.value],
      position: [[labelText.x, labelText.y]],
      ...this.#style.labelText,
    })).filter(Boolean)
    const labelTextData = this.#basicData.map(({tickText}) => tickText && ({
      data: [tickText.value],
      position: [[tickText.x, tickText.y]],
      ...this.#style.tickText,
    })).filter(Boolean)
    const titleTextData = this.#titleTextData.map(({x, y, value}) => ({
      data: [value],
      position: [[x, y]], 
      ...this.#style.titleText,
    }))
    this.drawBasic('arc', arcData)
    this.drawBasic('line', basicData)
    this.drawBasic('text', fragmentTextData.concat(labelTextData, titleTextData))
  }
}

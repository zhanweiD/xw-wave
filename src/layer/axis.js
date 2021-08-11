import * as d3 from 'd3'
import {merge} from 'lodash'
import LayerBase, {scaleTypes} from './base'
import Scale from '../data/scale'

// 坐标系类型
const axisType = {
  CARTESIAN: 'cartesian', // 直角坐标系
  POLAR: 'polar', // 极坐标系
}

// 默认选项
const defaultOptions = {
  type: axisType.CARTESIAN,
}

// 刻度线的默认样式
const defaultTickLine = {
  stroke: 'white',
  strokeWidth: 1,
  strokeOpacity: 0.2,
  fillOpacity: 0,
}

// 轴线的默认样式
const defaultAxisLine = {
  stroke: 'white',
  strokeWidth: 1,
  strokeOpacity: 0.5,
}

// 文字的默认样式
const defaultText = {
  fillOpacity: 0.8,
  fontSize: 8,
}

// 默认样式
const defaultStyle = {
  circle: {},
  labelOffset: 10,
  lineAxisX: defaultAxisLine, // X轴线
  lineAxisY: defaultAxisLine, // Y轴线
  lineTickX: defaultTickLine, // X刻度线
  lineTickY: defaultTickLine, // Y刻度线
  lineAngle: defaultTickLine, // 角度线
  lineRadius: defaultTickLine, // 半径线
  textX: defaultText, // X标签
  textY: defaultText, // Y标签
  textAngle: defaultText, // 角度标签
  textRadius: defaultText, // 半径标签
}

// 获取坐标值
const getPosition = (type, targetScale) => {
  const position = []
  if (targetScale?.type === 'band' || targetScale?.type === 'point') {
    const needOffset = targetScale.type === 'band' && type === axisType.CARTESIAN
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
      count: 5, // 优化的刻度数量
      zero: false, // 定义域是否包含 0
      paddingInner: 0, // band 比例尺间距占比
      fixedPaddingInner: null, // band 比例尺固定间距
      fixedBandWidth: null, // band 比例尺固定带宽
      fixedBoundary: 'start', // band 比例尺吸附边界
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
    textXT: [],
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

  // 比例尺融合，多图层共用坐标轴
  #merge = scales => {
    merge(this.#scale.nice, scales.nice)
    scaleTypes.forEach(type => {
      if (!scales[type]) return
      if (!this.#scale[type]) {
        this.#scale[type] = scales[type]
      } else if (this.#scale[type].type === 'linear') {
        const [current, incoming] = [this.#scale[type].domain(), scales[type].domain()]
        if (current[0] > current[1] !== incoming[0] > incoming[1]) {
          this.warn('图层比例尺不匹配', {current, incoming})
        } else {
          const isReverse = current[0] > current[1]
          const start = isReverse ? Math.max(current[0], incoming[0]) : Math.min(current[0], incoming[0])
          const end = isReverse ? Math.min(current[1], incoming[1]) : Math.max(current[1], incoming[1])
          this.#scale[type].domain([start, end])
        }
      }
      // 基于现在的比例尺进行优化，要求优化函数有幂等性
      this.#scale[type] = new Scale({
        type: this.#scale[type].type,
        domain: this.#scale[type].domain(),
        range: this.#scale[type].range(),
        nice: this.#scale.nice,
      })
    })
  }

  // 传入数据数组和比例尺，辅助线需要外部的比例尺
  setData(data, scales) {
    this.#merge(scales)
    const {type, layout, containerWidth} = this.options
    const {left, top, width, height} = layout
    // 清空数据
    Object.keys(this.#lineData).map(key => this.#lineData[key] = [])
    Object.keys(this.#textData).map(key => this.#textData[key] = [])
    // 水平坐标轴，垂直线分割宽度
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
    // 垂直坐标轴，水平线分割高度
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
    // 角度坐标轴，分割角度射线
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
    // 半径坐标轴，半径圆环
    const positionRadius = getPosition(type, this.#scale.scaleRadius)
    this.#lineData.lineRadius.push(...positionRadius.map(([label, value]) => ({
      value: label,
      cx: left + width / 2,
      cy: top + height / 2,
      rx: value,
      ry: value,
    })))
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {labelOffset, textX, textY, textAngle, textRadius} = this.#style
    const offset = labelOffset
    // X轴主轴标签在线的正下方
    this.#textData.textX = this.#textData.textX.map(({value, x2, y2}) => {
      return this.createText({x: x2, y: y2, position: 'bottom', value, style: textX, offset})
    })
    // X轴副轴标签在线的正上方
    this.#textData.textXT = this.#textData.textXT.map(({value, x1, y1}) => {
      return this.createText({x: x1, y: y1, position: 'top', value, style: textX, offset})
    })
    // Y轴主轴标签在线的左下方
    this.#textData.textY = this.#textData.textY.map(({value, x1, y1}) => {
      const position = this.#scale.scaleY?.type === 'linear' ? 'right-bottom' : 'right'
      return this.createText({x: x1, y: y1, position, value, style: textY})
    })
    // Y轴副轴标签在线的右下方
    this.#textData.textYR = this.#textData.textYR.map(({value, x2, y2}) => {
      return this.createText({x: x2, y: y2, position: 'left-bottom', value, style: textY})
    })
    // 角度坐标在线的延伸处
    this.#textData.textAngle = this.#lineData.lineAngle.map(({value, x2, y2, angle}) => {
      const _angle = Math.abs((angle + 360) % 360)
      const [isTop, isBottom, isLeft, isRight] = [_angle === 0, _angle === 180, _angle > 180, _angle < 180]
      const position = isTop ? 'top' : isBottom ? 'bottom' : isLeft ? 'left' : isRight ? 'right' : 'default'
      return this.createText({x: x2, y: y2, position, value, style: textAngle, offset})
    })
    // 半径坐标在角度坐标第一根线的右侧
    this.#textData.textRadius = this.#lineData.lineRadius.map(({value, cx, cy, rx}) => {
      return this.createText({x: cx, y: cy - rx, position: 'right', value, style: textRadius, offset})
    })
  }

  // 绘制
  draw() {
    const {scaleX, scaleXT, scaleY, scaleYR} = this.#scale
    const transformLineData = key => [{
      position: this.#lineData[key].map(({x1, y1, x2, y2}) => [x1, y1, x2, y2]),
      ...this.#style[key],
    }]
    const transformRadiusData = key => [{
      data: this.#lineData[key].map(({rx, ry}) => [rx, ry]),
      position: this.#lineData[key].map(({cx, cy}) => [cx, cy]),
      ...this.#style[key],
    }]
    const transformTextData = (key, style) => [{
      data: this.#textData[key].map(({value}) => value),
      position: this.#textData[key].map(({x, y}) => [x, y]),
      ...this.#style[style || key],
    }]
    if (scaleX?.type === 'linear' || scaleXT?.type === 'linear') {
      this.drawBasic('line', transformLineData('lineAxisX'), 'lineAxisX')
      this.drawBasic('line', transformLineData('lineTickX'), 'lineTickX')
    }
    if (scaleY?.type === 'linear' || scaleYR?.type === 'linear') {
      this.drawBasic('line', transformLineData('lineAxisY'), 'lineAxisY')
      this.drawBasic('line', transformLineData('lineTickY'), 'lineTickY')
    }
    this.drawBasic('line', transformLineData('lineAngle'), 'lineAngle')
    this.drawBasic('circle', transformRadiusData('lineRadius'), 'lineRadius')
    this.drawBasic('text', transformTextData('textX'), 'textX')
    this.drawBasic('text', transformTextData('textY'), 'textY')
    this.drawBasic('text', transformTextData('textXT', 'textX'), 'textXT')
    this.drawBasic('text', transformTextData('textYR', 'textY'), 'textYR')
    this.drawBasic('text', transformTextData('textAngle'), 'textAngle')
    this.drawBasic('text', transformTextData('textRadius'), 'textRadius')
  }
}

import * as d3 from 'd3'
import LayerBase, {scaleTypes} from './base'

// 坐标类型，单个或者组合
const axisType = {
  CARTESIAN: 'cartesian', // 直角坐标系
  HORIZONTAL: 'horizontal', // 水平单轴
  VERTICAL: 'vertical', // 垂直单轴
  POLAR: 'polar', // 极坐标系
  RADIUS: 'radius', // 半径单轴
  ANGLE: 'angle', // 角度单轴
}

// 默认选项
const defaultOptions = {
  type: axisType.CARTESIAN,
}

// 刻度线的默认样式
const defaultLine = {
  stroke: 'white',
  strokeWidth: 1,
  strokeOpacity: 0.2,
  fillOpacity: 0,
}

// 文字的默认样式
const defaultText = {
  fillOpacity: 0.8,
  fontSize: 8,
}

// 默认样式
const defaultStyle = {
  labelOffset: 5,
  circle: {},
  lineX: defaultLine,
  lineXT: defaultLine,
  lineY: defaultLine,
  lineYR: defaultLine,
  lineAngle: defaultLine,
  lineRadius: defaultLine,
  textX: defaultText,
  textXT: defaultText,
  textY: defaultText,
  textYR: defaultText,
  textAngle: defaultText,
  textRadius: defaultText,
}

// 获取坐标值
const getPosition = (type, targetScale) => {
  const position = []
  if (targetScale?.type === 'band' || targetScale?.type === 'point') {
    const needOffset = targetScale.type === 'band' && (
      type === axisType.CARTESIAN || type === axisType.HORIZONTAL || type === axisType.VERTICAL
    )
    targetScale.domain().forEach(label => {
      position.push([label, targetScale(label) + (needOffset ? targetScale.bandwidth() / 2 : 0)])
    })
  } else if (targetScale?.type === 'linear') {
    const [min, max] = targetScale.domain()
    d3.range(min, max + 1, (max - min) / (targetScale.nice.count)).forEach(label => {
      position.push([label, targetScale(label)])
    })
  }
  return position
}

// 坐标轴图层
export default class AxisLayer extends LayerBase {
  #scale = {}

  #lineData = {
    lineX: [],
    lineXT: [],
    lineY: [],
    lineYR: [],
    lineAngle: [],
    lineRadius: [],
  }

  #textData = {
    textX: [],
    textXT: [],
    textY: [],
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
    const lineKey = ['lineX', 'lineXT', 'lineY', 'lineYR', 'lineAngle', 'lineRadius']
    const textKey = ['textX', 'textXT', 'textY', 'textYR', 'textAngle', 'textRadius']
    super({...defaultOptions, ...layerOptions}, waveOptions, [...lineKey, ...textKey])
    const {type} = this.options
    this.className = `wave-${type}-axis`
  }

  // 比例尺融合，多图层共用坐标轴
  #mergeScale = scales => {
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
    })
  }

  // 传入数据数组和比例尺，辅助线需要外部的比例尺
  setData(data, scale) {
    this.#mergeScale(scale)
    const {type, layout, containerWidth} = this.options
    const {left, top, width, height} = layout
    // 清空数据
    Object.keys(this.#lineData).map(key => this.#lineData[key] = [])
    Object.keys(this.#textData).map(key => this.#textData[key] = [])
    // 水平坐标轴，垂直线分割宽度
    if (type === axisType.HORIZONTAL || type === axisType.CARTESIAN) {
      const position1 = getPosition(type, this.#scale.scaleX)
      const position2 = getPosition(type, this.#scale.scaleXT)
      const mapping = ([label, value]) => ({
        value: label,
        x1: left + value,
        x2: left + value,
        y1: top,
        y2: top + height,
      })
      this.#lineData.lineX.push(...position1.map(mapping))
      this.#lineData.lineXT.push(...position2.map(mapping)) 
    }
    // 垂直坐标轴，水平线分割高度
    if (type === axisType.VERTICAL || type === axisType.CARTESIAN) {
      const position1 = getPosition(type, this.#scale.scaleY)
      const position2 = getPosition(type, this.#scale.scaleYR)
      const mapping = ([label, value]) => ({
        value: label,
        x1: 0,
        x2: containerWidth,
        y1: top + value,
        y2: top + value,
      })
      this.#lineData.lineY.push(...position1.map(mapping))
      this.#lineData.lineYR.push(...position2.map(mapping))
    }
    // 角度坐标轴，分割角度射线
    if (type === axisType.ANGLE || type === axisType.POLAR) {
      const position = getPosition(type, this.#scale.scaleAngle)
      const maxRadius = this.#scale.scaleRadius?.range()[1] || Math.max(width / 2, height / 2)
      this.#lineData.lineAngle.push(...position.map(([label, value]) => ({
        value: label,
        angle: value,
        x1: left + width / 2,
        y1: top + height / 2,
        x2: left + width / 2 + Math.sin((value / 180) * Math.PI) * maxRadius,
        y2: top + height / 2 - Math.cos((value / 180) * Math.PI) * maxRadius,
      })))
    }
    // 半径坐标轴，半径圆环
    if (type === axisType.RADIUS || type === axisType.POLAR) {
      const position = getPosition(type, this.#scale.scaleRadius)
      this.#lineData.lineRadius.push(...position.map(([label, value]) => ({
        value: label,
        cx: left + width / 2,
        cy: top + height / 2,
        rx: value,
        ry: value,
      })))
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {labelOffset, textX, textXT, textY, textYR, textAngle, textRadius} = this.#style
    // X轴主轴标签在线的正下方
    this.#textData.textX = this.#lineData.lineX.map(({value, x2, y2}) => {
      return this.createText({x: x2, y: y2, position: 'bottom', value, style: textX, offset: labelOffset})
    })
    // X轴副轴标签在线的正上方
    this.#textData.textXT = this.#lineData.lineXT.map(({value, x1, y1}) => {
      return this.createText({x: x1, y: y1, position: 'top', value, style: textXT, offset: labelOffset})
    })
    // Y轴主轴标签在线的左下方
    this.#textData.textY = this.#lineData.lineY.map(({value, x1, y1}) => {
      const position = this.#scale.scaleY?.type === 'linear' ? 'right-bottom' : 'right'
      return this.createText({x: x1, y: y1, position, value, style: textY, offset: labelOffset})
    })
    // Y轴副轴标签在线的右下方
    this.#textData.textYR = this.#lineData.lineYR.map(({value, x2, y2}) => {
      return this.createText({x: x2, y: y2, position: 'left-bottom', value, style: textYR, offset: labelOffset})
    })
    // 角度坐标在线的延伸处
    this.#textData.textAngle = this.#lineData.lineAngle.map(({value, x2, y2, angle}) => {
      const _angle = Math.abs((angle + 360) % 360)
      const [isTop, isBottom, isLeft, isRight] = [_angle === 0, _angle === 180, _angle > 180, _angle < 180]
      const position = isTop ? 'top' : isBottom ? 'bottom' : isLeft ? 'left' : isRight ? 'right' : 'default'
      return this.createText({x: x2, y: y2, position, value, style: textAngle, offset: labelOffset})
    })
    // 半径坐标在角度坐标第一根线的右侧
    this.#textData.textRadius = this.#lineData.lineRadius.map(({value, cx, cy, rx}) => {
      return this.createText({x: cx, y: cy - rx, position: 'right', value, style: textRadius, offset: labelOffset})
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
    const transformTextData = key => [{
      data: this.#textData[key].map(({value}) => value),
      position: this.#textData[key].map(({x, y}) => [x, y]),
      ...this.#style[key],
    }]
    scaleX?.type === 'linear' && this.drawBasic('line', transformLineData('lineX'), 'lineX')
    scaleXT?.type === 'linear' && this.drawBasic('line', transformLineData('lineXT'), 'lineXT')
    scaleY?.type === 'linear' && this.drawBasic('line', transformLineData('lineY'), 'lineY')
    scaleYR?.type === 'linear' && this.drawBasic('line', transformLineData('lineYR'), 'lineYR')
    this.drawBasic('line', transformLineData('lineAngle'), 'lineAngle')
    this.drawBasic('circle', transformRadiusData('lineRadius'), 'lineRadius')
    this.drawBasic('text', transformTextData('textX'), 'textX')
    this.drawBasic('text', transformTextData('textXT'), 'textXT')
    this.drawBasic('text', transformTextData('textY'), 'textY')
    this.drawBasic('text', transformTextData('textYR'), 'textYR')
    this.drawBasic('text', transformTextData('textAngle'), 'textAngle')
    this.drawBasic('text', transformTextData('textRadius'), 'textRadius')
  }
}

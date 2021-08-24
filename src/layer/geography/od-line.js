import * as d3 from 'd3'
import LayerBase from '../base'

// 默认样式
const defaultStyle = {
  odLine: {
    fillOpacity: 0,
    strokeWidth: 1,
  },
  flyingObject: {
    path: null,
  },
}

// 默认的动画配置
const defaultAnimation = {
  flyingObject: {
    loop: {
      type: 'path',
      path: '.wave-basic-odLine',
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
    super(layerOptions, waveOptions, ['odLine', 'flyingObject', 'text'])
    this.tooltipTargets = ['odLine']
    this.className = 'wave-od-line'
  }

  // 根据两点绘制一条二次贝塞尔曲线
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

  // 传入二维表
  setData(data, scales) {
    this.#data = data || this.#data
    const headers = this.#data.data.map(({header}) => header)
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const fromXIndex = headers.findIndex(header => header === 'fromX')
    const fromYIndex = headers.findIndex(header => header === 'fromY')
    const toXIndex = headers.findIndex(header => header === 'toX')
    const toYIndex = headers.findIndex(header => header === 'toY')
    // 初始化比例尺
    this.#scale = this.createScale({}, this.#scale, scales)
    const {scaleX, scaleY} = this.#scale
    if (scaleX && scaleY) {
      this.#odLineData = pureTableList.map(d => {
        const [fromX, fromY, toX, toY] = [d[fromXIndex], d[fromYIndex], d[toXIndex], d[toYIndex]]
        const position = {fromX: scaleX(fromX), fromY: scaleY(fromY), toX: scaleX(toX), toY: scaleY(toY)}
        return {
          // 展示原始的地理坐标数据
          source: [
            {category: 'from', value: `(${fromX},${fromY})`},
            {category: 'to', value: `(${toX},${toY})`},
          ],
          // 地理坐标转化为 svg 坐标后计算 path
          data: this.#getPath(position),
          position,
        }
      })
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {flyingObject} = this.#style
    // 有飞行物设置
    if (flyingObject.path) {
      this.#flyingObjectData = this.#odLineData.map(({position}) => ({
        transform: `translate(${position.fromX},${position.fromY})`,
        transformOrigin: `${position.fromX} ${position.fromY}`,
        data: flyingObject.path,
      }))
      // 路径动画配置
      this.setAnimation(defaultAnimation)
    }
  }

  draw() {
    const odLineData = [{
      data: this.#odLineData.map(({data}) => data),
      source: this.#odLineData.map(({source}) => source),
      ...this.#style.odLine,
    }]
    const flyingObjectData = [{
      data: this.#flyingObjectData.map(({data}) => data),
      transform: this.#flyingObjectData.map(({transform}) => transform),
      transformOrigin: this.#flyingObjectData.map(({transformOrigin}) => transformOrigin),
      ...this.#style.flyingObject,
    }]
    this.drawBasic('path', odLineData, 'odLine')
    this.drawBasic('path', flyingObjectData, 'flyingObject')
  }
}

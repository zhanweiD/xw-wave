import * as d3 from 'd3'
import LayerBase from '../base'

// 默认样式
const defaultStyle = {
  odLine: {
    fillOpacity: 0,
    strokeWidth: 1,
  },
}

export default class ODLineLayer extends LayerBase {
  #data = []

  #scale = {}

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
    super(layerOptions, waveOptions, ['odLine', 'text'])
    this.className = 'wave-od-line'
    this.tooltipTargets = ['odLine']
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
      this.#odLineData = pureTableList.map(d => ({
        // 展示原始的地理坐标数据
        source: Object.entries({
          fromX: d[fromXIndex], 
          fromY: d[fromYIndex], 
          toX: d[toXIndex], 
          toY: d[toYIndex],
        }).map(([category, value]) => ({category, value})),
        // 地理坐标转化为 svg 坐标后计算 path
        data: this.#getPath({
          fromX: scaleX(d[fromXIndex]), 
          fromY: scaleY(d[fromYIndex]), 
          toX: scaleX(d[toXIndex]), 
          toY: scaleY(d[toYIndex]),
        }),
      }))
    }
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
  }

  draw() {
    const odLineData = [{
      data: this.#odLineData.map(({data}) => data),
      source: this.#odLineData.map(({source}) => source),
      ...this.#style.odLine,
    }]
    this.drawBasic('path', odLineData, 'odLine')
  }
}

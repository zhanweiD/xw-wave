/* eslint-disable no-unused-vars */
import * as d3 from 'd3'
import chroma from 'chroma-js'
import getLayout from './layout/standard'
import ThemeConfig from './util/theme'
import LayerBase from './layer/base'
import TextLayer from './layer/text'
import AxisLayer from './layer/axis'
import RectLayer from './layer/rect'
import LegendLayer from './layer/legend'
import ArcLayer from './layer/arc'
import LineLayer from './layer/line'
import RadarLayer from './layer/radar'
import createUuid from './util/uuid'
import AuxiliaryLayer from './layer/auxiliary'
import ScatterLayer from './layer/scatter'
import MatrixLayer from './layer/matrix'
import GaugeLayer from './layer/gauge'

// 图表状态
const stateMapping = {
  INITILIZE: 'initilize', // 初始化
  READY: 'ready', // 就绪
  WARN: 'warn', // 发生错误
  DESTROY: 'destroy', // 已销毁
}

// 图表图层
const LayerMapping = {
  axis: AxisLayer, // 坐标轴
  legend: LegendLayer, // 图例
  text: TextLayer, // 文本
  rect: RectLayer, // 矩形
  arc: ArcLayer, // 圆弧
  radar: RadarLayer, // 雷达多边形
  line: LineLayer, // 折线
  auxiliary: AuxiliaryLayer, // 辅助直线
  scatter: ScatterLayer, // 辅助直线
  matrix: MatrixLayer, // 矩阵
  gauge: GaugeLayer, // 仪表盘
}

// 图表类主要用于管理图层
export default class Wave {
  #state = null

  #container = null

  #containerHeight = null

  #containerWidth = null

  #baseFontSize = 1

  #padding = null

  #layout = null

  #root = null

  #layer = []

  #theme = []

  get layout() {
    return this.#layout
  }

  get layer() {
    return this.#layer
  }

  get theme() {
    return this.#theme
  }

  get baseFontSize() {
    return this.#baseFontSize
  }

  set theme(theme) {
    this.#theme = theme
  }

  set baseFontSize(baseFontSize) {
    this.#baseFontSize = baseFontSize
  }

  constructor({
    container,
    adjust = 'auto',
    width = 100,
    height = 100,
    padding = [0, 50, 30, 50],
    theme = 'glaze',
    layout = 'standard',
  }) {
    // 初始化状态和容器
    this.#state = stateMapping.INITILIZE
    this.#container = d3.select(container)

    // 确定图表宽高
    if (adjust === 'auto') {
      const rect = this.#container._groups[0][0].getBoundingClientRect()
      this.#containerWidth = rect.width
      this.#containerHeight = rect.height
    } else {
      this.#containerWidth = width
      this.#containerWidth = height
    }

    // 确定主绘图区域的内边距
    if (padding.length === 1) {
      this.#padding = [padding[0], padding[0], padding[0], padding[0]]
    } else if (padding.length === 2) {
      this.#padding = [padding[0], padding[1], padding[0], padding[1]]
    } else if (padding.length === 3) {
      this.#padding = [padding[0], padding[1], padding[2], padding[1]]
    } else {
      this.#padding = padding
    }

    // 初始化 dom 结构
    this.#container.html('')
    this.#root = this.#container
      .append('svg')
      .attr('width', this.#containerWidth)
      .attr('height', this.#containerHeight)

    // 初始化布局信息
    this.#layout = getLayout({
      type: layout,
      containerWidth: this.#containerWidth,
      containerHeight: this.#containerHeight,
      padding: this.#padding,
    })

    // 初始化主题颜色
    this.#theme = theme
  }

  /**
   * 控制整个图表的显示隐藏
   * @param {Boolean} isVisiable 是否可见
   */
  setVisible(isVisiable) {
    this.#layer.forEach(layer => layer.setVisible(isVisiable))
  }

  /**
   * 根据主题获取颜色
   * @param {Number} count 数量
   */
  getColor(count) {
    let colors = ThemeConfig[this.#theme]?.colors || ThemeConfig.glaze.colors
    // 颜色数量小于等于三时
    if (count <= 3) {
      colors = colors.slice(2, 7)
    }
    // 颜色数量等于四时
    if (count === 4) {
      colors = colors.slice(2)
    }
    return chroma.scale(colors).mode('lch').colors(count)
  }

  /**
   * 创建一个图层
   * @param {String} type 图层类型
   * @param {Object} options 图层配置参数
   * @returns {LayerBase}
   */
  createLayer(type, options = {}) {
    // 暴露给图层的上下文环境
    const context = {
      root: this.#root,
      container: this.#container,
      baseFontSize: this.baseFontSize,
      getColor: this.getColor.bind(this),
      warn: this.warn.bind(this),
    }
    // 根据类型创建图层
    const layer = new LayerMapping[type](options, context)
    const layerID = options.id || createUuid()
    this.#layer.push({id: layerID, instance: layer})
    // 销毁 layer 的时候同步删除 wave 中的实例
    layer.event.on('destroy', () => {
      const index = this.#layer.findIndex(({id}) => id === layerID)
      this.#layer.splice(index, 1)
    })
    return layer
  }

  // 重绘制所有图层
  draw({redraw = false}) {
    redraw && this.#layer.forEach(layer => layer.instance.setData())
    redraw && this.#layer.forEach(layer => layer.instance.setStyle())
    this.#layer.forEach(layer => layer.draw())
  }

  /**
   * 图表报错生命周期
   * @param {String} text 报错信息
   */
  warn({text, data}) {
    this.#state = stateMapping.WARN
    this.#root.html('')
    console.error(text, data)
  }

  // 销毁所有图层
  destroy() {
    this.#layer.forEach(layer => layer.instance.destroy())
    this.#state = stateMapping.DESTROY
  }
}

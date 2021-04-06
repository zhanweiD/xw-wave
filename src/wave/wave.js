/* eslint-disable no-unused-vars */
import * as d3 from 'd3'
import chroma from 'chroma-js'
import getLayout from './layout'
import ThemeConfig from '../util/theme'
import TextLayer from '../layer/text'
import AxisLayer from '../layer/axis'
import RectLayer from '../layer/rect'
import LegendLayer from '../layer/legend'
import LayerBase from '../layer/base'

// 图表状态
const stateMapping = {
  INITILIZE: 'initilize', // 初始化
  READY: 'ready', // 就绪
  WARN: 'warn', // 发生错误
}

// 图表图层
const LayerMapping = {
  axis: AxisLayer, // 坐标轴
  legend: LegendLayer, // 图例
  text: TextLayer, // 文本
  rect: RectLayer, // 矩形
  polygon: () => null, // 多边形
  line: () => null, // 直线/曲线
  circle: () => null, // 圆/椭圆
  arc: () => null, // 圆弧
  decoration: () => null, // 装饰
}

// 二维表数据处理工具
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
    padding = [60, 60, 60, 60],
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
  setVisiable(isVisiable) {
    this.#layer.forEach(layer => layer.setVisiable(isVisiable))
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
   * 获取文字的真实字号
   * @param {Number} size 相对字号
   * @returns {Number}
   */
  fontSize(size) {
    return this.#baseFontSize * size
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
      layout: this.#layout,
      getColor: this.getColor.bind(this),
      fontSize: this.fontSize.bind(this),
    }
    // 根据类型创建图层
    const layer = new LayerMapping[type](options, context)
    this.#layer.push({
      id: options.id || this.#layer.length,
      instance: layer,
    })
    // TODO: 销毁 layer 的时候同步删除
    return layer
  }

  // 重绘制所有图层
  draw() {
    this.#layer.forEach(layer => layer.data())
    this.#layer.forEach(layer => layer.scale())
    this.#layer.forEach(layer => layer.style())
    this.#layer.forEach(layer => layer.draw())
  }

  /**
   * 图表报错生命周期
   * @param {String} text 报错信息
   */
  warn({text}) {
    this.#state = stateMapping.WARN
    this.#root.html('')
    console.error(text)
  }

  // 销毁所有图层
  destroy() {
    this.#layer.forEach(layer => layer.destroy())
  }
}

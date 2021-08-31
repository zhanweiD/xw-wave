import * as d3 from 'd3'
import LayerBase from '../base'

// 默认选项
const defaultOptions = {
  zoom: false,
}

// 默认样式
const defaultStyle = {
  padding: 0,
  circle: {},
  text: {},
}

export default class PackLayer extends LayerBase {
  #data = null

  #circleData = []

  #textData = []

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['circle', 'text'])
    this.className = `wave${this.options.zoom ? '-zoom-' : '-'}pack`
    this.tooltipTargets = ['circle']
  }

  // 传入表格关系型数据
  setData(relation) {
    this.#data = relation || this.#data
    const root = {name: 'root', children: this.#data.data.nodes.filter(({level}) => level === 0)}
    this.#data.set('treeData', d3.hierarchy(root).sum(d => d.value).sort((a, b) => b.value - a.value))
    this.#data.set('maxHeight', d3.max(this.#data.get('treeData').descendants().map(({height}) => height + 1)))
    // 初始视角
    const {width, height} = this.options.layout
    this.#data.set('view', [width, height])
    this.#data.set('offset', [0, 0])
    this.#data.set('k', 1)
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top} = this.options.layout
    const {padding, circle, text} = this.#style
    const pack = d3.pack().size(this.#data.get('view')).padding(padding)
    const nodes = pack(this.#data.get('treeData')).descendants()
    const [offsetX, offsetY] = this.#data.get('offset')
    // 原始绘图数据
    this.#circleData = nodes.map(({x, y, r, height, data}) => ({
      cx: x + left + offsetX,
      cy: y + top + offsetY,
      value: data.name,
      height,
      r,
    }))
    // 根据高度进行分类
    this.#circleData = d3.range(0, this.#data.get('maxHeight')).map(value => {
      return this.#circleData.filter(({height}) => height === value)
    }).reverse()
    // 颜色跟随深度
    const colors = this.getColor(this.#circleData.length, circle.fill)
    this.#circleData.forEach((groupData, i) => groupData.forEach(item => (item.color = colors[i])))
    // 标签文字数据
    this.#textData = this.#circleData.map(groupData => groupData.map(({cx, cy, value}) => this.createText({
      x: cx, y: cy, value, style: text, position: 'center',
    })))
  }

  // 绘制
  draw() {
    const circleData = this.#circleData.map(groupData => {
      const data = groupData.map(({r}) => [r, r])
      const position = groupData.map(({cx, cy}) => [cx, cy])
      const source = groupData.map(({value}) => ({value}))
      const fill = groupData.map(({color}) => color)
      return {data, position, source, ...this.#style.circle, fill}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      const textAnchor = groupData.map(item => item.textAnchor)
      return {data, position, textAnchor, ...this.#style.text}
    })
    // 只展示最里层文字防遮挡
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData.slice(textData.length - 1))
    // 内置缩放事件
    if (this.options.zoom && this.options.engine === 'svg') {
      this.root.selectAll('.wave-basic-circle').on('click', this.#zoom)
    }
  }

  #zoom = (event, data) => {
    const {cx, cy, rx, ry} = data
    const {left, top, width, height} = this.options.layout
    const prevK = this.#data.get('k')
    const nextK = (Math.min(width, height) / (rx + ry)) * prevK
    // 移动目标到中心
    const [prevX, prevY] = this.#data.get('offset')
    const nextX = (width / 2 - (cx - prevX - left) / prevK) * nextK - (width * (nextK - 1)) / 2
    const nextY = (height / 2 - (cy - prevY - top) / prevK) * nextK - (height * (nextK - 1)) / 2
    // 更新数据
    this.#data.set('k', nextK)
    this.#data.set('offset', [nextX, nextY])
    this.#data.set('view', [width * nextK, height * nextK])
    // 范围计算和绘制
    this.setStyle()
    this.draw()
  }
}

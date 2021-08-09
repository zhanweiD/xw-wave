import * as d3 from 'd3'
import LayerBase from './base'

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
    super({...layerOptions}, waveOptions, ['circle', 'text'])
    this.className = 'wave-pack'
    this.tooltipTargets = ['circle']
  }

  // 传入表格关系型数据
  setData(relation) {
    this.#data = relation || this.#data
    const root = {name: 'root', children: this.#data.data.nodes.filter(({level}) => level === 0)}
    this.#data.set('treeData', d3.hierarchy(root).sum(d => d.value).sort((a, b) => b.value - a.value))
    this.#data.set('maxHeight', d3.max(this.#data.get('treeData').descendants().map(({height}) => height + 1)))
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {layout} = this.options
    const {padding, circle, text} = this.#style
    const pack = d3.pack().size([layout.width, layout.height]).padding(padding)
    const nodes = pack(this.#data.get('treeData')).descendants()
    // 原始绘图数据
    this.#circleData = nodes.map(({x, y, r, height, data}) => ({
      cx: x + layout.left, cy: y + layout.top, rx: r, ry: r, height, value: data.name,
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
      const data = groupData.map(({rx, ry}) => [rx, ry])
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
  }
}

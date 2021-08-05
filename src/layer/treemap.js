import * as d3 from 'd3'
import LayerBase from './base'

// 平铺模式（d3内置）
const tileType = {
  BINARY: 'treemapBinary', // 平衡二叉树
  DICE: 'treemapDice', // 水平划分
  SLICE: 'treemapSlice', // 垂直划分
  SLICEDICE: 'treemapSliceDice', // 深度奇数垂直偶数水平
  SQUARIFY: 'treemapSquarify', // 保持纵横比
}

// 对齐方式
const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

// 默认选项
const defaultOptions = {
  tile: tileType.SQUARIFY,
}

// 默认样式
const defaultStyle = {
  align: alignType.MIDDLE,
  verticalAlign: alignType.MIDDLE,
  labelGap: 5,
  rect: {},
  text: {
    fontSize: 12,
  },
}

export default class TreemapLayer extends LayerBase {
  #data = null
  
  #scale = {}

  #rectData = []

  #textData = []

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

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['rect', 'text'])
    const {mode} = this.options
    this.className = `wave-${mode}-treemap`
    this.tooltipTargets = ['rect']
  }

  // 传入表格关系型数据
  setData(relation) {
    this.#data = relation || this.#data
    const {nodes} = this.#data.data
    const {tile, layout} = this.options
    const {left, top, width, height} = layout
    const root = {name: 'root', children: nodes.filter(({level}) => level === 0)}
    const treemap = d3.treemap().tile(d3[tile]).size([width, height]).round(true).paddingInner(1)
    const leaves = treemap(d3.hierarchy(root).sum(d => d.value).sort((a, b) => b.value - a.value)).leaves()
    this.#rectData = leaves.map(({x0, x1, y0, y1, data}) => ({
      x: x0 + left,
      y: y0 + top,
      width: x1 - x0,
      height: y1 - y0,
      name: data.name,
      value: data.value,
    }))
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {rect, align, verticalAlign, labelGap, text} = this.#style
    // 颜色跟随主题
    const colors = this.getColor(this.#rectData.length, rect.fill)
    this.#rectData.forEach((item, i) => (item.color = colors[i]))
    // 基础文字数据，包括标签和数值
    this.#textData = this.#rectData.map(({x, y, width, height, value, name}) => {
      let [nameX, nameY, position] = [null, null, null]
      if (align === alignType.START && verticalAlign === alignType.START) {
        [nameX, nameY, position] = [x, y, 'right-bottom']
      } else if (align === alignType.MIDDLE && verticalAlign === alignType.START) {
        [nameX, nameY, position] = [x + width / 2, y, 'bottom']
      } else if (align === alignType.END && verticalAlign === alignType.START) {
        [nameX, nameY, position] = [x + width, y, 'left-bottom'] 
      } else if (align === alignType.START && verticalAlign === alignType.MIDDLE) {
        [nameX, nameY, position] = [x, y + height / 2 - labelGap / 2, 'right-top']
      } else if (align === alignType.MIDDLE && verticalAlign === alignType.MIDDLE) {
        [nameX, nameY, position] = [x + width / 2, y + height / 2 - labelGap / 2, 'top']
      } else if (align === alignType.END && verticalAlign === alignType.MIDDLE) {
        [nameX, nameY, position] = [x + width, y + height / 2 - labelGap / 2, 'left-top'] 
      } else if (align === alignType.START && verticalAlign === alignType.END) {
        [nameX, nameY, position] = [x, y + height - text.fontSize - labelGap, 'right-top']
      } else if (align === alignType.MIDDLE && verticalAlign === alignType.END) {
        [nameX, nameY, position] = [x + width / 2, y + height - text.fontSize - labelGap, 'top']
      } else if (align === alignType.END && verticalAlign === alignType.END) {
        [nameX, nameY, position] = [x + width, y + height - text.fontSize - labelGap, 'left-top'] 
      }
      // 返回标签和数值
      return [
        this.createText({value: name, x: nameX, y: nameY, position, style: text}),
        this.createText({value, x: nameX, y: nameY + text.fontSize + labelGap, position, style: text}),
      ]
    })
  }

  // 绘制
  draw() {
    const rectData = [{
      data: this.#rectData.map(({width, height}) => [width, height]),
      source: this.#rectData.map(({dimension, name, value}) => ({dimension, category: name, value})),
      position: this.#rectData.map(({x, y}) => [x, y]),
      ...this.#style.rect,
      fill: this.#rectData.map(({color}) => color),
    }]
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      const textAnchor = groupData.map(item => item.textAnchor)
      return {data, position, textAnchor, ...this.#style.text}
    })
    this.drawBasic('rect', rectData)
    this.drawBasic('text', textData)
  }
}

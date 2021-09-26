import * as d3 from 'd3'
import LayerBase from '../base'

const defaultOptions = {
  zoom: false,
}

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

  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['circle', 'text'])
    this.className = `wave${this.options.zoom ? '-zoom-' : '-'}pack`
    this.tooltipTargets = ['circle']
  }

  setData(relation) {
    this.#data = relation || this.#data
    const root = {name: 'root', children: this.#data.data.nodes.filter(({level}) => level === 0)}
    this.#data.set(
      'treeData',
      d3
        .hierarchy(root)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value)
    )
    this.#data.set(
      'maxHeight',
      d3.max(
        this.#data
          .get('treeData')
          .descendants()
          .map(({height}) => height + 1)
      )
    )
    // origin config for zoom
    const {width, height} = this.options.layout
    this.#data.set('view', [width, height])
    this.#data.set('offset', [0, 0])
    this.#data.set('k', 1)
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top} = this.options.layout
    const {padding, circle, text} = this.#style
    const pack = d3.pack().size(this.#data.get('view')).padding(padding)
    const nodes = pack(this.#data.get('treeData')).descendants()
    const [offsetX, offsetY] = this.#data.get('offset')
    // origin circle data
    this.#circleData = nodes.map(({x, y, r, height, data}) => ({
      cx: x + left + offsetX,
      cy: y + top + offsetY,
      value: data.name,
      height,
      r,
    }))
    // classify circles by height
    this.#circleData = d3
      .range(0, this.#data.get('maxHeight'))
      .map(value => {
        return this.#circleData.filter(({height}) => height === value)
      })
      .reverse()
    // color is related to height
    const colors = this.getColor(this.#circleData.length, circle.fill)
    this.#circleData.forEach((group, i) => group.forEach(item => (item.color = colors[i])))
    // label data
    this.#textData = this.#circleData.map(group => group.map(({cx, cy, value}) => this.createText({
      x: cx,
      y: cy,
      value,
      style: text,
      position: 'center',
    })))
  }

  draw() {
    const circleData = this.#circleData.map(group => {
      const data = group.map(({r}) => [r, r])
      const position = group.map(({cx, cy}) => [cx, cy])
      const source = group.map(({value}) => ({value}))
      const fill = group.map(({color}) => color)
      return {data, position, source, ...this.#style.circle, fill}
    })
    const textData = this.#textData.map(group => {
      const data = group.map(({value}) => value)
      const position = group.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    // only show the innermost label to prevent occlusion
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData.slice(textData.length - 1))
    // private zoom event
    if (this.options.zoom && this.options.engine === 'svg') {
      this.event.onWithOff('click-circle', 'private', this.#zoom)
    }
  }

  #zoom = ({data}) => {
    const {cx, cy, rx, ry} = data
    const {left, top, width, height} = this.options.layout
    const prevK = this.#data.get('k')
    const nextK = (Math.min(width, height) / (rx + ry)) * prevK
    // move the target circle to the center of the container
    const [prevX, prevY] = this.#data.get('offset')
    const nextX = (width / 2 - (cx - prevX - left) / prevK) * nextK - (width * (nextK - 1)) / 2
    const nextY = (height / 2 - (cy - prevY - top) / prevK) * nextK - (height * (nextK - 1)) / 2
    // update data
    this.#data.set('k', nextK)
    this.#data.set('offset', [nextX, nextY])
    this.#data.set('view', [width * nextK, height * nextK])
    // redraw
    this.setStyle()
    this.draw()
  }
}

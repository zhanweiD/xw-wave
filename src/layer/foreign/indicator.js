import * as d3 from 'd3'
import {merge} from 'd3-array'
import {transformAttr} from '../../utils/common'
import LayerBase from '../base'

const flexAlignType = {
  START: 'start',
  MIDDLE: 'center',
  END: 'end',
}

const iconPositionType = {
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
}

const defaultStyle = {
  iconPosition: iconPositionType.LEFT,
  align: flexAlignType.START,
  verticalAlign: flexAlignType.MIDDLE,
  icon: {
    src: null,
    width: 0,
    height: 0,
    padding: '10px',
  },
  text: {
    fontSize: 12,
  },
}

export default class IndicatorLayer extends LayerBase {
  #data = [[]]

  #textContainer = null

  #iconContainer = null

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    const {width, height} = this.options.layout
    this.className = 'wave-indicator'
    this.root = this.options.root
      .append('foreignObject')
      .style('width', width)
      .style('height', height)
      .append('xhtml:div')
      .attr('class', `${this.className}-conatiner`)
      .style('width', `${width}px`)
      .style('height', `${height}px`)
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
    this.#textContainer = this.root
      .append('xhtml:div')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .style('align-items', 'center')
    this.#iconContainer = this.root.append('xhtml:img')
  }

  // data is 2-dimensional array of object
  setData(data) {
    if (!Array.isArray(data)) {
      this.#data = [[data]]
    } else if (data.length === 0) {
      this.#data = [[]]
    } else {
      this.#data = data.map(item => (Array.isArray(item) ? item : [item]))
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {text} = this.#style
    // initialize text data
    for (let i = 0; i < this.#data.length; i++) {
      const row = this.#data[i]
      for (let j = 0; j < row.length; j++) {
        if (typeof row[j] !== 'object') {
          row[j] = {text: `${row[j]}`, ...text}
        } else if (!row[j].fontSize) {
          merge({}, text, row[j])
        }
      }
    }
  }

  draw() {
    const {align, verticalAlign, icon, iconPosition} = this.#style
    if (iconPosition === iconPositionType.TOP || iconPosition === iconPositionType.BOTTOM) {
      this.root.style('flex-direction', 'column')
    }
    if (iconPosition === iconPositionType.LEFT || iconPosition === iconPositionType.TOP) {
      const root = this.root.nodes()[0]
      const iconContainer = this.#iconContainer.nodes()[0]
      const textContainer = this.#textContainer.nodes()[0]
      root.replaceChild(iconContainer, textContainer)
      root.append(textContainer)
    }
    // icon
    if (icon.src) {
      const style = transformAttr(icon)
      const {src, width, height} = style
      this.#iconContainer.attr('src', src).attr('width', width).attr('height', height)
      Object.entries(style).forEach(([key, value]) => this.#iconContainer.style(key, value))
    }
    // texts
    this.#textContainer
      .selectAll(`.${this.className}-row`)
      .data(this.#data)
      .join('xhtml:div')
      .attr('class', `${this.className}-row`)
      .style('display', 'flex')
      .style('flex-direction', 'row')
      .style('justify-content', align)
      .style('align-items', verticalAlign)
      .each((rowData, i, rows) => {
        d3.select(rows[i])
          .selectAll(`.${this.className}-column`)
          .data(rowData)
          .join('xhtml:div')
          .attr('class', `${this.className}-column`)
          .each((columnData, j, columns) => {
            const element = d3.select(columns[j])
            // transform attributes: fontSize => font-size
            const style = transformAttr(columnData)
            Object.entries(style).forEach(([key, value]) => element.style(key, value))
            element.text(style.text)
          })
      })
  }
}

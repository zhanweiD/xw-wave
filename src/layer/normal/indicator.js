import {max} from 'd3'
import LayerBase from '../base'

const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

const defaultStyle = {
  align: alignType.START,
  verticalAlign: alignType.MIDDLE,
  rowSpacing: 5,
  columnSpacing: 5,
  text: {
    fontSize: 12,
  },
}

export default class IndicatorLayer extends LayerBase {
  #data = [[]]

  #textData = []

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['text'])
    this.className = 'wave-indicator'
  }

  // data is 2-dimensional array of object
  setData(data) {
    if (!Array.isArray(data) || data.length === 0 || data.findIndex(item => !Array.isArray(item)) !== -1) {
      this.log.error('Indicator Layer: Invaild Data')
      return
    }
    this.#data = data || this.#data
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {left, top} = this.options.layout
    const {align, verticalAlign, columnSpacing, rowSpacing, text} = this.#style
    const {fontSize} = text
    let totalLineHeight = top - columnSpacing
    this.#textData = []
    // format data for convenient handling
    for (let i = 0; i < this.#data.length; i++) {
      const row = this.#data[i]
      for (let j = 0; j < row.length; j++) {
        if (typeof row[j] !== 'object') {
          row[j] = {text: `${row[j]}`, fontSize}
        } else if (!row[j].fontSize) {
          row[j].fontSize = fontSize
        }
      }
      // calculate lineHeight for each row
      const rowTextData = []
      let totalTextWidth = left
      totalLineHeight += max(row.map(item => item.fontSize)) + columnSpacing
      for (let j = 0; j < row.length; j++) {
        rowTextData.push({
          style: row[j],
          ...this.createText({
            x: totalTextWidth,
            y: totalLineHeight,
            style: row[j],
            value: row[j].text,
          }),
        })
        totalTextWidth += rowTextData[j].textWidth + rowSpacing
      }
      this.#textData.push(rowTextData)
    }
    // move text by align type
    const rowWidths = this.#textData.map(row => row[row.length - 1].x + row[row.length - 1].textWidth)
    const maxRowWidth = max(rowWidths)
    this.#textData.forEach((rowTextData, i) => {
      // horizontal align
      const hOffset = maxRowWidth - rowWidths[i]
      if (align === alignType.MIDDLE) {
        rowTextData.forEach(item => (item.x += hOffset / 2))
      } else if (align === alignType.END) {
        rowTextData.forEach(item => (item.x += hOffset))
      }
      // vertical align
      const columnHeights = rowTextData.map(item => item.style.fontSize)
      const maxColumnHeight = max(columnHeights)
      rowTextData.forEach(item => {
        const vOffset = maxColumnHeight - item.style.fontSize
        if (verticalAlign === alignType.MIDDLE) {
          item.y -= vOffset / 2
        } else if (verticalAlign === alignType.START) {
          item.y -= vOffset
        }
      })
    })
  }

  draw() {
    let textData = this.#textData.reduce((prev, cur) => [...prev, ...cur])
    textData = textData.map(({value, x, y, style}) => ({
      data: [value],
      position: [[x, y]],
      ...this.#style.text,
      ...style,
    }))
    this.drawBasic('text', textData)
  }
}

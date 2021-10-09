import {max} from 'd3'
import {sum} from 'lodash'
import getTextWidth from '../../utils/text-width'
import LayerBase from '../base'

const alignType = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

const iconPositionType = {
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right',
}

const defaultStyle = {
  iconUrl: null,
  iconSize: 30,
  align: alignType.START,
  verticalAlign: alignType.MIDDLE,
  iconPosition: iconPositionType.TOP,
  rowGap: 5,
  columnGap: 5,
  iconGap: 15,
  text: {
    fontSize: 12,
  },
}

export default class IndicatorLayer extends LayerBase {
  #data = [[]]

  #iconData = {}

  #textData = []

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['text', 'icon'])
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
    const {left, top, width, height} = this.options.layout
    const {align, verticalAlign, columnGap, rowGap, text, iconUrl, iconSize, iconGap, iconPosition} = this.#style
    this.#textData = []
    // initialize
    for (let i = 0; i < this.#data.length; i++) {
      const row = this.#data[i]
      for (let j = 0; j < row.length; j++) {
        if (typeof row[j] !== 'object') {
          row[j] = {text: `${row[j]}`, fontSize: text.fontSize}
        } else if (!row[j].fontSize) {
          row[j].fontSize = text.fontSize
        }
      }
    }
    const rowHeights = this.#data.map(row => max(row.map(item => item.fontSize)))
    const rowWidths = this.#data.map(row => sum(row.map(item => getTextWidth(item.text, item.fontSize))))
    const totalHeight = sum(rowHeights) + rowGap * (this.#data.length - 1)
    const totalWidth = max(rowWidths.map((item, i) => item + (this.#data[i].length - 1) * columnGap))
    let [textTop, textLeft] = [top + (height - totalHeight) / 2, left + (width - totalWidth) / 2]
    if (iconUrl) {
      this.#iconData = {iconSize, iconUrl}
      if (iconPosition === iconPositionType.TOP) {
        textTop += (iconSize + iconGap) / 2
        this.#iconData.x = textLeft + (totalWidth - iconSize) / 2
        this.#iconData.y = textTop - iconSize - iconGap
      } else if (iconPosition === iconPositionType.LEFT) {
        textLeft += (iconSize + iconGap) / 2
        this.#iconData.x = textLeft - iconSize - iconGap
        this.#iconData.y = textTop + (totalHeight - iconSize) / 2
      } else if (iconPosition === iconPositionType.RIGHT) {
        textLeft -= (iconSize + iconGap) / 2
        this.#iconData.x = textLeft + totalWidth + iconGap
        this.#iconData.y = textTop + (totalHeight - iconSize) / 2
      }
    }
    // handling data
    let currentHeight = textTop - columnGap
    for (let i = 0; i < this.#data.length; i++) {
      const row = this.#data[i]
      const rowTextData = []
      let currentWidth = textLeft
      // calculate lineHeight for each row
      currentHeight += rowHeights[i] + columnGap
      for (let j = 0; j < row.length; j++) {
        rowTextData.push({
          style: row[j],
          ...this.createText({
            x: currentWidth,
            y: currentHeight,
            style: row[j],
            value: row[j].text,
          }),
        })
        currentWidth += rowTextData[j].textWidth + rowGap
      }
      this.#textData.push(rowTextData)
    }
    // move text by align type
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
      rowTextData.forEach(item => {
        const vOffset = rowHeights[i] - item.style.fontSize
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
    const iconData = [
      {
        data: [[this.#iconData.iconUrl, this.#iconData.iconSize, this.#iconData.iconSize]],
        position: [[this.#iconData.x, this.#iconData.y]],
      },
    ]
    this.drawBasic('text', textData)
    this.drawBasic('image', iconData, 'icon')
  }
}

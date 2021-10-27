import {select} from 'd3'
import {merge} from 'lodash'
import ScrollAnimation from '../../animation/scroll'
import DataBase from '../../data/base'
import {addStyle, range, transformAttr} from '../../utils/common'
import LayerBase from '../base'

const defaultStyle = {
  integerPlace: 8,
  decimalPlace: 2,
  thousandth: true,
  character: {},
  text: {},
}

const defaultAnimation = {
  delay: 0,
  duration: 2000,
}

const characterSet = ['', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '.']

export default class DigitalFlopLayer extends LayerBase {
  #data = new DataBase()

  #magnitudes = {}

  #cellData = []

  #style = defaultStyle

  #animation = defaultAnimation

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    const {containerWidth, containerHeight, layout} = this.options
    const {left, top, width, height} = layout
    this.className = 'wave-digital-flop'
    this.root = this.options.root
      .append('foreignObject')
      .style('width', containerWidth)
      .style('height', containerHeight)
      .append('xhtml:div')
      .attr('class', `${this.className}-container`)
      .style('width', `${width}px`)
      .style('height', `${height}px`)
      .style('margin-left', `${left}px`)
      .style('margin-top', `${top}px`)
      .style('display', 'flex')
      .style('flex-direction', 'row')
      .style('overflow', 'hidden')
  }

  setData(data) {
    this.#data = this.createData('base', this.#data, data)
    this.#magnitudes = {}
    const {value} = this.#data.data
    const [integer, decimal] = String(value).split('.')
    for (let i = 0; integer && i < integer.length; i++) {
      this.#magnitudes[integer.length - (i + 1)] = integer[i]
    }
    for (let i = 0; decimal && i < decimal.length; i++) {
      this.#magnitudes[-(i + 1)] = decimal[i]
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {width, height} = this.options.layout
    const {integerPlace, decimalPlace, thousandth} = this.#style
    const commaPlace = thousandth ? Math.floor(Math.abs(integerPlace - 1) / 3) : 0
    const placeNumber = integerPlace + decimalPlace + commaPlace + (decimalPlace > 0 ? 1 : 0)
    const prevData = this.#cellData.map(({text}) => text)
    this.#data.set('cellSize', [width / placeNumber, height])
    this.#cellData = []
    // create the text for each place
    range(integerPlace + commaPlace - 1, -decimalPlace, -1).forEach(index => {
      let text
      if (thousandth && index >= 0) {
        if ((index + 1) % 4 === 0) {
          text = ','
        } else {
          text = this.#magnitudes[index - Math.floor(Math.abs(index - 1) / 3)]
        }
      } else {
        text = this.#magnitudes[index]
      }
      this.#cellData.push({text, prevText: prevData.shift()})
      // inject decimal point
      if (index === 0 && decimalPlace > 0) {
        this.#cellData.push({text: '.', prevText: prevData.shift()})
      }
    })
    // filter redundant data
    let index = 0
    while (index < this.#cellData.length && !Number(this.#cellData[index].text)) {
      this.#cellData[index].text = ''
      index++
    }
  }

  draw() {
    this.root
      .selectAll(`.${this.className}-group`)
      .data(this.#cellData)
      .join('xhtml:div')
      .attr('class', `${this.className}-group`)
      .style('height', `${this.#data.get('cellSize')[1] * characterSet.length}px`)
      .selectAll(`.${this.className}-text`)
      .data(characterSet)
      .join('xhtml:div')
      .attr('class', `${this.className}-text`)
      .style('display', 'grid')
      .style('place-items', 'center')
      .style('position', 'relative')
      .style('width', `${this.#data.get('cellSize')[0]}px`)
      .style('height', `${this.#data.get('cellSize')[1]}px`)
      .each((d, i, els) => {
        if (this.#style.character[d]) {
          // use image
          const {left, top, bottom, right} = this.#style.character[d]
          const [width, height] = [right - left, bottom - top]
          const [offsetX, offsetY] = [-width / 2 - left, -height / 2 - top]
          select(els[i])
            .append('img')
            .attr('src', this.#style.character.url)
            .style('position', 'absolute')
            .style('clip', `rect(${top}px,${right}px,${bottom}px,${left}px)`)
            .style('transform', `translate(${offsetX}px,${offsetY}px)`)
            .style('left', '50%')
            .style('top', '50%')
        } else {
          // use font
          const el = select(els[i])
          const style = transformAttr(this.#style.text)
          addStyle(el, style, i)
          select(els[i]).text(d)
        }
      })
  }

  setAnimation(options) {
    merge(this.#animation, options)
  }

  playAnimation() {
    const {duration, delay} = this.#animation
    this.root.selectAll(`.${this.className}-group`).each((data, i, els) => {
      if (data.text !== '') {
        const prevIndex = characterSet.findIndex(character => character === data.prevText)
        const index = characterSet.findIndex(character => character === data.text)
        const offset = prevIndex === -1 ? index : index - prevIndex
        const animation = new ScrollAnimation({
          delay,
          duration,
          targets: select(els[i]).nodes(),
          offset: [0, this.#data.get('cellSize')[1] * offset],
          loop: false,
          easing: 'easeOutSine',
        })
        animation.play()
      }
    })
  }

  test() {
    setTimeout(() => {
      this.setData(new DataBase({value: Math.random() * 10 ** this.#style.integerPlace}))
      this.setStyle()
      this.draw()
      this.playAnimation()
    }, 5000)
  }
}

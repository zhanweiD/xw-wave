import anime from 'animejs'
import {select} from 'd3'
import {cloneDeep, merge} from 'lodash'
import ScrollAnimation from '../../animation/scroll'
import DataBase from '../../data/base'
import {addStyle, range, transformAttr} from '../../utils/common'
import LayerBase from '../base'

const MODE = {
  VERTICAL: 'vertical',
  FLOP: 'flop',
}

const defaultOptions = {
  mode: MODE.VERTICAL,
}

const defaultStyle = {
  zoom: 1,
  integerPlace: 8,
  decimalPlace: 2,
  thousandth: true,
  character: {},
  cell: {
    fontSize: '50px',
    backgroundColor: 'black',
  },
}

const defaultAnimation = {
  delay: 0,
  duration: 2000,
  easing: 'easeOutSine',
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
    super({...defaultOptions, ...layerOptions}, waveOptions)
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
    const judgeNumber = ({text}) => text >= '0' && text <= '9'
    const firstNumber = this.#cellData.findIndex(judgeNumber)
    const lastNumber = this.#cellData.length - cloneDeep(this.#cellData).reverse().findIndex(judgeNumber) - 1
    this.#cellData.forEach((item, i) => (i < firstNumber || i > lastNumber) && (item.text = ''))
  }

  draw() {
    const {mode} = this.options
    const {character, zoom, cell} = this.#style
    const [cellWidth, cellHeight] = this.#data.get('cellSize')
    this.root
      .selectAll(`.${this.className}-group`)
      .data(this.#cellData)
      .join('xhtml:div')
      .attr('class', `${this.className}-group`)
      .style('width', `${cellWidth}px`)
      .style('height', `${cellHeight}px`)
      .selectAll(`.${this.className}-cell`)
      .data(mode === MODE.FLOP ? cloneDeep(characterSet).reverse() : characterSet)
      .join('xhtml:div')
      .attr('class', `${this.className}-cell`)
      .style('width', `${cellWidth}px`)
      .style('height', `${cellHeight}px`)
      .style('position', mode === MODE.FLOP ? 'absolute' : 'relative')
      .each((d, i, els) => {
        const container = select(els[i])
        addStyle(container, transformAttr(cell), i)
        if (mode === MODE.VERTICAL) {
          if (character[d]) {
            const {left, top, bottom, right} = character[d]
            const [width, height] = [right - left, bottom - top]
            const [offsetX, offsetY] = [-width / 2 - left, -height / 2 - top]
            container
              .style('transform', `scale(${zoom})`)
              .selectAll('img')
              .data([null])
              .join('img')
              .attr('src', character.url)
              .style('position', 'absolute')
              .style('clip', `rect(${top}px,${right}px,${bottom}px,${left}px)`)
              .style('transform', `translate(${offsetX}px,${offsetY}px)`)
              .style('left', '50%')
              .style('top', '50%')
          } else {
            container.text(d)
          }
        } else if (mode === MODE.FLOP) {
          container
            .selectAll('.top')
            .data([null])
            .join('xhtml:div')
            .attr('class', 'digital top')
            .style('transform-origin', '50% 100%')
            .style('top', 0)
            .style('bottom', '50%')
            .style('align-items', 'end')
            .style('z-index', (data, index, elements) => {
              const zIndex = select(elements[0]).style('z-index')
              return zIndex === 'auto' ? -characterSet.length + i : zIndex
            })
          container
            .selectAll('.bottom')
            .data([null])
            .join('xhtml:div')
            .attr('class', 'digital bottom')
            .style('transform-origin', '50% 0%')
            .style('top', '50%')
            .style('bottom', 0)
            .style('z-index', (data, index, elements) => {
              const zIndex = select(elements[0]).style('z-index')
              return zIndex === 'auto' ? -characterSet.length + i : zIndex
            })
          container
            .selectAll('.digital')
            .style('position', 'absolute')
            .style('left', 0)
            .style('right', 0)
            .style('line-height', 0)
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('backface-visibility', 'hidden')
            .style('overflow', 'hidden')
            .style('background-color', cell.backgroundColor)
          if (character[d]) {
            const {left, top, bottom, right} = character[d]
            const [width, height] = [right - left, bottom - top]
            const [offsetX, offsetY] = [-width / 2 - left, -height / 2 - top]
            container
              .selectAll('.digital')
              .style('transform', `scale(${zoom})`)
              .selectAll('img')
              .data([null])
              .join('img')
              .attr('src', character.url)
              .style('position', 'absolute')
              .style('clip', `rect(${top}px,${right}px,${bottom}px,${left}px)`)
              .style('transform', `translate(${offsetX}px,${offsetY}px)`)
              .style('backface-visibility', 'hidden')
              .style('left', '50%')
            container.selectAll('.top img').style('top', '100%')
          } else {
            container.selectAll('.digital').text(d)
          }
        }
      })
  }

  setAnimation(options) {
    merge(this.#animation, options)
  }

  playAnimation() {
    const {mode} = this.options
    const {duration, delay, easing} = this.#animation
    this.root.selectAll(`.${this.className}-group`).each((d, i, els) => {
      let prevIndex = characterSet.findIndex(character => character === d.prevText)
      let index = characterSet.findIndex(character => character === d.text)
      prevIndex = prevIndex === -1 ? 0 : prevIndex
      index = index === -1 ? 0 : index
      if (index !== prevIndex && mode === MODE.VERTICAL) {
        new ScrollAnimation({
          targets: select(els[i]).nodes(),
          offset: [0, this.#data.get('cellSize')[1] * (index - prevIndex)],
          loop: false,
          duration,
          easing,
          delay,
        }).play()
      } else if (index !== prevIndex) {
        const cells = select(els[i]).selectAll(`.${this.className}-cell`).nodes().reverse()
        const [backCell, frontCell] = [cells[index], cells[prevIndex]]
        const backTop = select(backCell).selectAll('.top')
        const backBottom = select(backCell).selectAll('.bottom')
        const frontTop = select(frontCell).selectAll('.top')
        const frontBottom = select(frontCell).selectAll('.bottom')
        // init flop with order
        frontTop.style('z-index', 3)
        frontBottom.style('z-index', 1)
        backTop.style('z-index', 1)
        backBottom.style('z-index', 2)
        anime({targets: backBottom.nodes(), rotateX: 180, duration: 0})
        anime({targets: backBottom.nodes(), rotateX: 0, duration, easing})
        anime({targets: frontTop.nodes(), rotateX: 180, duration, easing})
        // resume
        setTimeout(() => {
          frontTop.style('z-index', 'auto')
          frontBottom.style('z-index', 'auto')
          anime({targets: frontTop.nodes(), rotateX: 0, duration: 0, easing})
        }, duration)
      }
    })
  }
}

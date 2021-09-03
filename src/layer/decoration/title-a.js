/* eslint-disable camelcase */
import chroma from 'chroma-js'
import {fabric} from 'fabric'
import {easeQuadIn, easeQuadOut, easePolyIn} from 'd3'
import {range} from '../../util/common'
import LayerBase from '../base'

const defaultStyle = {
  mainColor: 'rgb(0,119,255)',
  minorColor: 'rgb(200,200,200)',
  lineGap: 4,
  topLine: {
    strokeWidth: 2,
  },
  middleLine: {
    strokeWidth: 2,
  },
  bottomLine: {
    strokeWidth: 2,
  },
  centerLine: {
    strokeWidth: 2,
  },
  centerArea: {},
  lightParallelogram: {},
  darkParallelograms: {},
}

export default class TitleALayer extends LayerBase {
  #data = {
    topLines: [],
    middleLines: [],
    bottomLines: [],
    centerArea: {},
    centerLine: {},
    centerStreamer: [],
    lightParallelograms: [],
    darkParallelograms: [],
  }

  #animationTimer = {
    side: null,
    center: null,
  }

  #streamerLength = {
    side: 0,
    center: 0,
  }

  #style = defaultStyle

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['polygon', 'area', 'curve', 'sideStreamer', 'centerStreamer'])
    this.className = 'wave-title-a'
    this.event.on('destroy', () => {
      clearTimeout(this.#animationTimer.side)
      clearTimeout(this.#animationTimer.center)
    })
  }

  /**
   * symmetric mapping according to the midline
   * @param {Array<Array<Number>>} data left points
   * @returns {Array<Array<Number>>} right points
   */
  #symmetricMapping = leftPoints => {
    const {left, width} = this.options.layout
    const middleX = left + width / 2
    return leftPoints.map(([x, y]) => [x + (middleX - x) * 2, y])
  }

  /**
   * create a parallelogram with auto degree
   * the parallelogram does not exceed the area
   * @param {Number} left
   * @param {Number} top
   * @param {Number} width
   * @param {Number} height
   * @param {Number} angle
   * @returns {Array<Number} polygon points
   */
  #createParallelogram = (left, top, width, height, angle = 45) => [
    [left, top],
    [left + width, top],
    [left + width + Math.sin(angle) * height, top + height],
    [left + Math.sin(angle) * height, top + height],
  ]

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {createGradient, layout} = this.options
    const {left, top, width, height} = layout
    const {lineGap, mainColor, minorColor} = this.#style
    const sqrt3 = Math.sqrt(3)
    // left area
    const [al_left, al_right, al_top, al_bottom] = [left, left + width * 0.4, top + height * 0.2, top + height * 0.8]
    const [al_width, al_height] = [al_right - al_left, al_bottom - al_top]
    // center area
    const [ac_left, ac_right, ac_top, ac_bottom] = [left + width * 0.4, left + width * 0.6, top, top + height * 0.9]
    const [ac_width, ac_height] = [ac_right - ac_left, ac_bottom - ac_top]
    // left top line
    const leftTopLinePoints = [
      [al_right - lineGap, al_top + al_height / 3 - lineGap / sqrt3],
      [al_right - (al_height / 3) * 2 * sqrt3 - lineGap / sqrt3, al_bottom - lineGap],
      [al_left, al_bottom - lineGap],
    ]
    // left middle line
    const leftMiddleLinePoints = [
      [al_right - (al_height / 3) * sqrt3, al_top],
      [al_right, al_top + al_height / 3],
      [al_right - (al_height / 3) * 2 * sqrt3, al_bottom],
      [al_left, al_bottom],
    ]
    // left bottom line
    const leftBottomLinePoints = [
      [al_right + ac_width / 3, al_top + al_height / 3 + (lineGap / sqrt3) * 2],
      [al_right, al_top + al_height / 3 + (lineGap / sqrt3) * 2],
      [al_right - (al_height / 3) * 2 * sqrt3 + lineGap / sqrt3, al_bottom + lineGap],
      [al_left + al_width / 2, al_bottom + lineGap],
    ]
    // right lines
    const rightTopLinePoints = this.#symmetricMapping(leftTopLinePoints)
    const rightMiddleLinePoints = this.#symmetricMapping(leftMiddleLinePoints)
    const rightBottomLinePoints = this.#symmetricMapping(leftBottomLinePoints)
    // group lines
    this.#data.topLines = [{
      points: leftTopLinePoints,
      stroke: createGradient({
        type: 'linear', 
        direction: 'horizontal', 
        colors: range(0, 1, 0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.1 ? 0.5 : alpha)),
      }),
    }, {
      points: rightTopLinePoints,
      stroke: createGradient({
        type: 'linear', 
        direction: 'horizontal', 
        colors: range(1, 0, -0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.1 ? 0.5 : alpha)),
      }),
    }]
    this.#data.middleLines = [{
      points: leftMiddleLinePoints,
      stroke: createGradient({
        type: 'linear', 
        direction: 'horizontal', 
        colors: range(0, 1, 0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.1 ? 1 : alpha)),
      }),
    }, {
      points: rightMiddleLinePoints,
      stroke: createGradient({
        type: 'linear', 
        direction: 'horizontal', 
        colors: range(1, 0, -0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.1 ? 1 : alpha)),
      }),
    }]
    this.#data.bottomLines = [{
      points: leftBottomLinePoints,
      stroke: createGradient({
        type: 'linear', 
        direction: 'horizontal', 
        colors: range(0, 1, 0.1).map(alpha => chroma(minorColor).alpha((0.5 - Math.abs(alpha - 0.5)) * 2)),
      }),
    }, {
      points: rightBottomLinePoints,
      stroke: createGradient({
        type: 'linear', 
        direction: 'horizontal', 
        colors: range(0, 1, 0.1).map(alpha => chroma(minorColor).alpha((0.5 - Math.abs(alpha - 0.5)) * 2)),
      }),
    }]
    // left light parallelograms
    const leftLightParallelograms = [
      this.#createParallelogram(al_left + al_width * 0.65, al_top, al_width / 15, al_height),
      this.#createParallelogram(al_left + al_width * 0.75, al_top, al_width / 20, al_height),
    ]
    // left dark parallelograms
    const leftDarkParallelograms = [
      this.#createParallelogram(al_left + al_width * 0.2, al_top, al_width / 15, al_height),
      this.#createParallelogram(al_left + al_width * 0.2 + al_width / 16, al_top, al_width / 15, al_height),
      this.#createParallelogram(al_left + al_width * 0.6, al_top, al_width / 10, al_height),
      this.#createParallelogram(al_left + al_width * 0.6 + al_width / 11, al_top, al_width / 10, al_height),
    ]
    // right parallelograms
    const rightLightParallelograms = leftLightParallelograms.map(value => this.#symmetricMapping(value))
    const rightDarkParallelograms = leftDarkParallelograms.map(value => this.#symmetricMapping(value))
    // group parallelograms
    leftLightParallelograms.concat(rightLightParallelograms).forEach(points => {
      this.#data.lightParallelograms.push({points, fill: chroma(mainColor).alpha(0.3)})
    })
    leftDarkParallelograms.concat(rightDarkParallelograms).forEach(points => {
      this.#data.darkParallelograms.push({points, fill: chroma(mainColor).alpha(0.15)})
    })
    // center area
    const coords = {x1: 0.5, x2: 0.5, y1: 1, y2: 1, r: 0, r2: 0.4}
    this.#data.centerArea = {
      points: [
        [ac_left + ac_width * 0, ac_top + ac_height, ac_top + ac_height],
        [ac_left + ac_width * 0.5, ac_top + ac_height, ac_top],
        [ac_left + ac_width * 1, ac_top + ac_height, ac_top + ac_height],
      ],
      fill: createGradient({
        type: 'radial',
        colors: [mainColor, chroma(mainColor).alpha(0)],
        ...coords,
      }),
    }
    // center line
    this.#data.centerLine = {
      points: [
        [ac_left, ac_top + ac_height],
        [ac_left + ac_width / 2, ac_top + ac_height - this.#style.centerLine.strokeWidth / 2],
        [ac_left + ac_width, ac_top + ac_height],
      ],
      stroke: createGradient({
        type: 'linear', 
        direction: 'horizontal', 
        colors: range(0, 1, 0.1).map(alpha => chroma(minorColor).alpha((0.5 - Math.abs(alpha - 0.5)) * 2)),
      }),
    }
    // center streamer line
    this.#data.centerStreamer = [{
      points: [
        [ac_left + ac_width / 2, ac_top + ac_height - this.#style.centerLine.strokeWidth / 2],
        [ac_left, ac_top + ac_height],
      ],
    }, {
      points: [
        [ac_left + ac_width / 2, ac_top + ac_height - this.#style.centerLine.strokeWidth / 2],
        [ac_left + ac_width, ac_top + ac_height],
      ],
    }]
    // streamer length
    this.#streamerLength.center = ac_width / 2
    leftMiddleLinePoints.reduce((prev, cur) => {
      this.#streamerLength.side += Math.sqrt((prev[0] - cur[0]) ** 2 + (prev[1] - cur[1]) ** 2)
      return cur
    })
  }

  draw() {
    const curveData = []
    const polygonData = []
    // center area
    const areaData = [{
      position: [this.#data.centerArea.points],
      fill: this.#data.centerArea.fill,
      curve: 'curveMonotoneX',
      ...this.#style.centerArea,
    }]
    // center line
    curveData.push({
      position: [this.#data.centerLine.points],
      stroke: this.#data.centerLine.stroke,
      curve: 'curveMonotoneX',
      ...this.#style.centerLine,
    })
    // center streamer line
    const centerStreamerData = [{
      position: this.#data.centerStreamer.map(({points}) => points),
      stroke: null,
      ...this.#style.centerLine,
    }]
    // side top lines
    curveData.push({
      position: this.#data.topLines.map(item => item.points),
      stroke: this.#data.topLines.map(item => item.stroke),
      ...this.#style.topLine,
    })
    // side middle lines
    const middleLineData = [{
      position: this.#data.middleLines.map(item => item.points),
      stroke: this.#data.middleLines.map(item => item.stroke),
      ...this.#style.middleLine,
    }]
    curveData.push(...middleLineData)
    // side bottom lines
    curveData.push({
      position: this.#data.bottomLines.map(item => item.points),
      stroke: this.#data.bottomLines.map(item => item.stroke),
      ...this.#style.bottomLine,
    })
    // light parallelograms
    polygonData.push({
      data: this.#data.lightParallelograms.map(item => item.points),
      fill: this.#data.lightParallelograms.map(item => item.fill),
      ...this.#style.lightParallelogram,
    })
    // dark parallelograms
    polygonData.push({
      data: this.#data.darkParallelograms.map(item => item.points),
      fill: this.#data.darkParallelograms.map(item => item.fill),
      ...this.#style.darkParallelograms,
    })
    this.drawBasic('polygon', polygonData)
    this.drawBasic('area', areaData)
    this.drawBasic('curve', curveData)
    this.drawBasic('curve', middleLineData, 'sideStreamer')
    this.drawBasic('curve', centerStreamerData, 'centerStreamer')
  }

  #findAnimationTargets = sublayer => {
    const container = this.root.getObjects().find(obj => obj.className === `${this.className}-${sublayer}`)
    const groups = container.getObjects().map(obj => obj.getObjects())
    const els = groups.reduce((prev, cur) => [...prev, ...cur], [])
    return els
  }

  // only for canvas
  playAnimation() {
    if (this.options.engine !== 'canvas') {
      this.log.warn('TitleA: animation is only available with canvas')
      return
    }
    // clear last animation
    clearTimeout(this.#animationTimer.side)
    clearTimeout(this.#animationTimer.center)
    // start play
    const {mainColor} = this.#style
    this.#playStreamerAnimation({
      duration: 3000,
      delay: 1000,
      color: chroma(mainColor).mix('#fff').brighten(),
      targets: this.#findAnimationTargets('sideStreamer'),
      setTimer: timer => this.#animationTimer.side = timer,
      headEase: easeQuadOut,
      tailEase: easeQuadIn,
      distance: this.#streamerLength.side,
    })
    this.#playStreamerAnimation({
      duration: 1000,
      endDelay: 3000,
      color: chroma(mainColor).mix('#fff').brighten(),
      targets: this.#findAnimationTargets('centerStreamer'),
      setTimer: timer => this.#animationTimer.center = timer,
      headEase: easePolyIn.exponent(2),
      tailEase: easePolyIn.exponent(3.5),
      distance: this.#streamerLength.center,
    })
  }

  #playStreamerAnimation = ({
    delay = 0,
    endDelay = 0,
    duration = 1000, 
    color,
    targets,
    distance,
    setTimer,
    headEase,
    tailEase,
  }) => {
    let time = 0
    const timeStep = 1000 / 30
    const {createGradient} = this.options
    // initilaize gradient
    const strokeLeft = createGradient({
      type: 'linear', 
      direction: 'horizontal', 
      colors: [chroma(color).alpha(1), chroma(color).alpha(0)],
    })
    const strokeRight = createGradient({
      type: 'linear', 
      direction: 'horizontal', 
      colors: [chroma(color).alpha(0), chroma(color).alpha(1)],
    })
    const animate = () => {
      time = (time + timeStep) % duration
      const headOffset = headEase(time / duration)
      const tailOffset = tailEase(time / duration)
      const strokeDashArray = [
        0,
        distance * tailOffset,
        distance * (headOffset - tailOffset),
        distance * (1 - headOffset), 
      ]
      // change gradient
      strokeLeft.coords.x1 = 1 - headOffset
      strokeLeft.coords.x2 = 1 - tailOffset + (tailOffset < 0.2 ? 0.2 - tailOffset : 0)
      strokeRight.coords.x1 = tailOffset
      strokeRight.coords.x2 = headOffset
      // i === 0 => left, i === 1 => right
      targets.forEach((target, i) => {
        target.stroke = i === 0 ? strokeLeft : strokeRight
        target.shadow = new fabric.Shadow({color: this.#style.mainColor, blur: 5, affectStroke: 5})
        target.strokeDashArray = strokeDashArray
      })
      // render and start next loop
      this.root.canvas.renderAll()
      const isNextTimeCycle = Math.abs(time) < 10 ** -8 || Math.abs(time - duration) < 10 ** -8
      setTimer(setTimeout(animate, isNextTimeCycle ? endDelay + delay : timeStep))
    }
    setTimer(setTimeout(animate, delay))
  }
}

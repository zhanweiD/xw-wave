import * as d3 from 'd3'
import DataBase from '../../data/base'
import LayerBase from '../base'

// official data from online, key is block code
const getUrl = key => `http://cdn.dtwave.com/waveview/geojson/${key}.json`

const defaultStyle = {
  block: {},
  text: {},
}

export default class BaseMapLayer extends LayerBase {
  #origin = null

  #data = {
    type: 'FeatureCollection',
    features: [],
  }

  #scale = {
    scaleX: x => -x,
    scaleY: y => -y,
  }

  #path = null

  #parentCode = []

  #backgroundRectData = {}

  #chinaBlocks = []

  #blockData = []

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

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['block', 'background', 'text'])
    this.className = 'wave-base-map'
    this.tooltipTargets = ['block']
    // means load data success
    this.isReady = false
    // get all blocks of china
    fetch(getUrl('all'))
      .then(res => res.json())
      .then(data => (this.#chinaBlocks = data))
      .catch(e => this.log.error('Fetch map data failed', e))
  }

  // data is GeoJSON or block code
  setData(origin, scales) {
    this.#origin = this.createData('base', this.#origin, origin, instance => instance.data)
    // use online data
    if (typeof origin?.data === 'number') {
      this.#fetchOnlineData(origin.data, result => {
        this.#data = result
        this.#calculateData(result, scales)
        this.setStyle()
        this.draw()
      })
    }
  }

  #fetchOnlineData = (code, callback, polling = 100) => {
    // wait for block data
    if (this.#chinaBlocks.length) {
      const children = this.#chinaBlocks.filter(({parent}) => parent === code)
      if (children.length) {
        Promise.all(
          children.map(
            ({adcode}) => new Promise((resolve, reject) => {
              fetch(getUrl(adcode))
                .then(res => resolve(res.json()))
                .catch(e => reject(e))
            })
          )
        )
          .then(list => {
            const dataSet = list.reduce((prev, cur) => [...prev, ...cur.features], [])
            callback({type: 'FeatureCollection', features: dataSet})
          })
          .catch(e => this.log.error('Fetch map data failed', e))
      }
    } else {
      // retry
      setTimeout(() => this.#fetchOnlineData(code, callback), polling)
    }
  }

  #calculateData = scales => {
    const {top, left, width, height} = this.options.layout
    const projection = d3.geoMercator().fitExtent(
      [
        [left, top],
        [width, height],
      ],
      this.#data
    )
    this.#path = d3.geoPath(projection)
    // transform scales
    this.#scale = this.createScale(
      {
        scaleX: x => projection([x, 0])[0],
        scaleY: y => projection([0, y])[1],
      },
      // give empty because default is useless
      {},
      scales
    )
    // drill up background block
    this.#backgroundRectData = {x: left, y: top, width, height}
    // drill down map block
    this.#blockData = this.#data.features.map(({geometry, properties}) => ({
      source: Object.entries(properties).map(([category, value]) => ({category, value})),
      geometry,
    }))
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    this.#textData = this.#data.features.map(({properties, geometry}) => this.createText({
      value: properties.name,
      x: this.#path.centroid(geometry)[0],
      y: this.#path.centroid(geometry)[1],
      style: this.#style.text,
      position: 'center',
    }))
  }

  draw() {
    const blockData = [
      {
        data: this.#blockData.map(({geometry}) => this.#path(geometry)),
        source: this.#blockData.map(({source}) => source),
        ...this.#style.block,
      },
    ]
    const textData = [
      {
        data: this.#textData.map(({value}) => value),
        position: this.#textData.map(({x, y}) => [x, y]),
        ...this.#style.text,
      },
    ]
    const rectData = [
      {
        data: [[this.#backgroundRectData.width, this.#backgroundRectData.height]],
        position: [[this.#backgroundRectData.x, this.#backgroundRectData.y]],
        fillOpacity: 0,
      },
    ]
    this.drawBasic('rect', rectData, 'background')
    this.drawBasic('path', blockData, 'block')
    this.drawBasic('text', textData)
    // reset coordinate system
    if (this.#blockData.length) {
      this.options.bindCoordinate(true, this)
    }
    // drill up on the map
    this.event.onWithOff('click-background', 'private', () => {
      const parentCode = this.#parentCode.pop()
      parentCode && this.setData(new DataBase(parentCode))
    })
    // drill down on the map
    this.event.onWithOff('click-block', 'private', ({data}) => {
      const blockCode = data.source.find(({category}) => category === 'adcode')?.value
      this.#parentCode.push(data.source.find(({category}) => category === 'parent')?.value?.adcode)
      this.setData(new DataBase(blockCode))
    })
  }
}

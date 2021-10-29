import {isNumber} from 'lodash'
import * as d3 from 'd3'

const defaultNice = {
  count: 0, // tick count
  zero: false, // domain extend
  paddingInner: 0, // for band type
  fixedPaddingInner: null, // for band type
  fixedBandwidth: null, // for band type
  fixedBoundary: 'start', // for band type
}

// do some scale customization based on d3
export default function Scale({type, domain, range, nice = defaultNice}) {
  let scale
  // discrete to continuous
  if (type === 'band') {
    scale = d3.scaleBand().domain(domain).range(range)
    if (isNumber(nice.fixedBandwidth) && isNumber(nice.fixedPaddingInner)) {
      const {fixedBandwidth, fixedPaddingInner, fixedBoundary} = nice
      const totalRange = fixedBandwidth * domain.length + fixedPaddingInner * (domain.length - 1)
      const offset = (totalRange - Math.abs(range[1] - range[0])) * (range[1] > range[0] ? 1 : -1)
      const [fixedStart, fixedEnd] = [fixedBoundary === 'start', fixedBoundary === 'end']
      // fixed bandwidth and padding
      scale.range([fixedEnd ? range[0] - offset : range[0], fixedStart ? range[1] + offset : range[1]])
      scale.paddingInner(fixedPaddingInner / (fixedPaddingInner + fixedBandwidth))
    } else if (isNumber(nice.fixedBandwidth)) {
      // auto padding
      scale.paddingInner(1 - (nice.fixedBandwidth * domain.length) / Math.abs(range[1] - range[0]))
    } else if (isNumber(nice.fixedPaddingInner)) {
      // auto bandwidth
      scale.paddingInner((nice.fixedPaddingInner * (domain.length - 1)) / Math.abs(range[1] - range[0]))
    } else if (nice) {
      // auto according ratio
      scale.paddingInner(isNumber(nice.paddingInner) ? nice.paddingInner : defaultNice.paddingInner)
    }
  }
  // special case of band which bandwidth equals zero
  if (type === 'point') {
    scale = d3.scalePoint().domain(domain).range(range)
  }
  // discrete to discrete
  if (type === 'ordinal') {
    scale = d3.scaleOrdinal().domain(domain).range(range)
  }
  // continuous to discrete
  if (type === 'quantize') {
    scale = d3.scaleQuantize().domain(domain).range(range)
    nice.zero && extendZero(scale)
    nice.count && niceScale(scale, nice.count)
  }
  // continuous to continuous
  if (type === 'linear') {
    scale = d3.scaleLinear().domain(domain).range(range)
    nice.zero && extendZero(scale)
    nice.count && niceScale(scale, nice.count)
  }
  // only for arc layer
  if (type === 'angle') {
    const totalLength = range[1] - range[0]
    const padding = (totalLength * nice.paddingInner) / domain.data[0].list.length
    const availableLength = totalLength * (1 - nice.paddingInner)
    const mappingArray = domain.data[1].list
      .reduce(
        (prev, cur, index) => {
          const startAngle = prev[index].endAngle + padding
          const endAngle = startAngle + availableLength * cur
          return [...prev, {startAngle, endAngle}]
        },
        [{endAngle: -padding}]
      )
      .slice(1)
    type = 'ordinal'
    scale = d3.scaleOrdinal().domain(domain.data[0].list).range(mappingArray)
  }
  scale.type = type
  scale.nice = nice && {...defaultNice, ...nice}
  return scale
}

/**
 * extend domain so that contains zero
 * @param {Scale} scale
 * @returns
 */
export const extendZero = scale => {
  let [start, end] = scale.domain()
  if (start <= end) {
    if (start > 0) {
      start = 0
    } else if (end < 0) {
      end = 0
    }
  } else {
    if (start < 0) {
      start = 0
    } else if (end > 0) {
      end = 0
    }
  }
  scale.domain([start, end])
}

/**
 * d3 default nice function is not suitable for us
 * @param {Scale} scale 比例尺
 * @param {Number} tickNumber
 */
export const niceScale = (scale, tickNumber) => {
  let [start, end] = scale.domain()
  // start must different from end
  if (start === end) {
    if (start === 0) {
      end += tickNumber
    } else {
      start -= tickNumber
      end += tickNumber
    }
  }
  // order
  let reverse = false
  if (start >= end) {
    [start, end] = [end, start]
    reverse = true
  }
  // change domain
  if (tickNumber > 0) {
    const distance = end - start
    const level = 10 ** Math.floor(Math.log10(Math.abs(distance / tickNumber)))
    // the blank ratio at the top of the chart
    const spaceThreshold = 0
    // step to ensure that the chart will not overflow
    let step = Math.ceil(distance / tickNumber / level) * level
    const newStart = Math.floor(start / step) * step
    let newEnd = newStart + tickNumber * step
    // too much blank
    if (newEnd > end) {
      const isOverflow = () => end + (level / 2) * tickNumber >= newEnd
      const isExceedThreshold = () => (newEnd - end) / (newEnd - newStart) > spaceThreshold
      while (!isOverflow() && isExceedThreshold()) {
        step -= level / 2
        newEnd = newStart + tickNumber * step
      }
    }
    // overflow
    while (newEnd < end) {
      step += level / 2
      newEnd = newStart + tickNumber * step
    }
    // nice domain
    scale.domain(reverse ? [newEnd, newStart] : [newStart, newEnd])
  }
}

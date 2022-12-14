import {isArray} from 'lodash'
import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../utils/common'

export default function drawRect({
  engine = 'svg',
  fill = '#fff',
  stroke = '#fff',
  strokeWidth = 0,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  transformOrigin = 'center',
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item,
  mask = null,
  filter = null,
  source = [],
  data = [], // [[width, height, rx, ry]]
  position = [], // [[x, y]]
  container,
  className,
  rectInterval = 0,
  type,
}) {
  const configuredData = data.map((size, i) => {
    return {
      className,
      x: type === 'bar' ? position[i][0] : position[i][0] + rectInterval * i,
      y: type === 'bar' ? position[i][1] + rectInterval * i : position[i][1],
      width: size[0],
      height: size[1],
      rx: size[2],
      ry: size[3],
      fill: getAttr(fill, i),
      stroke: getAttr(stroke, i),
      opacity: getAttr(opacity, i),
      fillOpacity: getAttr(fillOpacity, i),
      strokeOpacity: getAttr(strokeOpacity, i),
      strokeWidth: getAttr(strokeWidth, i),
      source: getAttr(source, i),
      filter: getAttr(filter, i),
      mask: getAttr(mask, i),
      transformOrigin: getTransformOrigin({size, position: position[i], transformOrigin}),
    }
  })
  if (engine === 'svg') {
    container
      .selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('rect')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('rx', d => d.rx)
      .attr('ry', d => d.ry)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('opacity', d => d.opacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform-origin', d => d.transformOrigin)
  } else if (engine === 'canvas') {
    configuredData.forEach(config => {
      const rect = new fabric.Rect({
        className: config.className,
        top: config.y,
        left: config.x,
        width: config.width,
        height: config.height,
        rx: config.rx,
        ry: config.ry,
        fill: mergeAlpha(config.fill, config.fillOpacity),
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
        source: config.source,
        selectable: false,
      })
      container.add(rect)
    })
  }
}

const getTransformOrigin = ({position, size, transformOrigin}) => {
  let result = transformOrigin
  const [x, y] = position
  const [width, height] = size
  if (transformOrigin === 'center') {
    result = `${x + width / 2}px ${y + height / 2}px`
  } else if (transformOrigin === 'left') {
    result = `${x}px ${y + height / 2}px`
  } else if (transformOrigin === 'right') {
    result = `${x + width}px ${y + height / 2}px`
  } else if (transformOrigin === 'top') {
    result = `${x + width / 2}px ${y}px`
  } else if (transformOrigin === 'bottom') {
    result = `${x + width / 2}px ${y + height}px`
  } else if (isArray(transformOrigin)) {
    result = `${transformOrigin[0]}px ${transformOrigin[1]}px`
  }
  return result
}

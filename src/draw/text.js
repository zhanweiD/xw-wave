import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../utils/common'

const writingModeMapping = {
  horizontal: 'horizontal-tb',
  vertical: 'vertical-rl',
}

export default function drawText({
  engine = 'svg',
  fontFamily = '',
  fontSize = 12,
  fontWeight = 'normal',
  fill = '#fff',
  stroke = '#fff',
  strokeWidth = 0,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  rotation = 0,
  shadow = '2px 2px 2px rgba(0,0,0,0)',
  writingMode = 'horizontal', // 'horizontal' or 'vertical'
  transformOrigin = null,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item,
  mask = null,
  filter = null,
  data = [], // array of string
  position = [], // [[x, y]]
  container,
  className,
}) {
  const configuredData = data.map((text, i) => ({
    text,
    className,
    x: position[i][0],
    y: position[i][1] + (engine === 'svg' ? -getAttr(fontSize, i) * 0.2 : getAttr(fontSize, i) * 0.2),
    fontSize: getAttr(fontSize, i),
    fontFamily: getAttr(fontFamily, i),
    fontWeight: getAttr(fontWeight, i),
    fill: getAttr(fill, i),
    stroke: getAttr(stroke, i),
    opacity: getAttr(opacity, i),
    fillOpacity: getAttr(fillOpacity, i),
    strokeOpacity: getAttr(strokeOpacity, i),
    strokeWidth: getAttr(strokeWidth, i),
    filter: getAttr(filter, i),
    mask: getAttr(mask, i),
    rotation: getAttr(rotation, i),
    shadow: getShadow(getAttr(shadow, i)),
    transformOrigin: getAttr(transformOrigin, i),
    writingMode: writingModeMapping[writingMode],
  }))
  if (engine === 'svg') {
    container
      .selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('text')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .text(d => d.text)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('opacity', d => d.opacity)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('font-family', d => d.fontFamily)
      .attr('font-size', d => d.fontSize)
      .attr('font-weight', d => d.fontWeight)
      .attr('writing-mode', d => d.writingMode)
      .style('text-shadow', d => d.shadow)
      .style('transform', d => (d.rotation ? `rotate(${d.rotation}deg)` : null))
      .style('transform-origin', d => d.transformOrigin)
      .style('pointer-events', 'none')
  }
  if (engine === 'canvas') {
    configuredData.forEach(config => {
      const text = new fabric.Text(config.text, {
        className: config.className,
        left: config.x,
        top: config.y,
        fontSize: config.fontSize,
        fontFamily: config.fontFamily,
        fontWeight: config.fontWeight,
        fill: mergeAlpha(config.fill, config.fillOpacity),
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
        shadow: config.shadow,
        originY: 'bottom',
        selectable: false,
        evented: false,
      })
      text.rotate(config.rotation)
      container.add(text)
    })
  }
}

const getShadow = shadow => {
  // disgusting: null is an object
  if (shadow && typeof shadow === 'object') {
    const {color = '#000', offset = [0, 0], blur = 0, hide = false} = shadow
    if (!hide) {
      return `${offset[0]}px ${-offset[1]}px ${blur}px ${color}`
    }
    return null
  }
  return shadow
}

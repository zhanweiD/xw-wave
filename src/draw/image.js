import {getAttr} from '../utils/common'

export default function drawImage({
  engine = 'svg',
  opacity = 1,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item,
  mask = null,
  filter = null,
  source = [],
  data = [], // [[url, width, height]]
  position = [], // [[x, y]]
  container,
  className,
}) {
  const configuredData = data.map((item, i) => ({
    className,
    url: item[0],
    width: item[1],
    height: item[2],
    x: position[i][0],
    y: position[i][1],
    opacity: getAttr(opacity, i),
    source: getAttr(source, i),
    filter: getAttr(filter, i),
    mask: getAttr(mask, i),
  }))
  if (engine === 'svg') {
    container
      .selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('image')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('opacity', d => d.opacity)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('xlink:href', d => d.url)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
  } else if (engine === 'canvas') {
    console.warn('Not support draw image in canvas yet')
  }
}

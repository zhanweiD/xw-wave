import {isArray} from 'lodash'
import {Graphics} from 'pixi.js'
import chroma from 'chroma-js'

// 绘制一组直线
export default function drawLine({
  engine = 'svg',
  stroke = '#fff',
  strokeWidth = 1,
  opacity = 1,
  strokeOpacity = 1,
  dasharray = '0',
  enableUpdateAnimation = false,
  updateAnimationDuration = 1000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  position = [], // 位置 [[x1,y1,x2,y2]]
  container,
  className,
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = position.map((data, i) => ({
    className,
    x1: data[0],
    y1: data[1],
    x2: data[2],
    y2: data[3],
    stroke: isArray(stroke) ? stroke[i] : stroke,
    opacity: isArray(opacity) ? opacity[i] : opacity,
    strokeOpacity: isArray(strokeOpacity) ? strokeOpacity[i] : strokeOpacity,
    strokeWidth: isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
    filter: isArray(filter) ? filter[i] : filter,
    mask: isArray(mask) ? mask[i] : mask,
    strokeDasharray: isArray(dasharray) ? dasharray[i] : dasharray,
    source: source.length > i ? source[i] : null,
  }))
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('line')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('stroke-dasharray', d => d.strokeDasharray)
      .attr('opacity', d => d.opacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('pointer-events', 'none')
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const graphics = new Graphics()
      const {x1, y1, x2, y2} = config
      const getColor = color => chroma(color || '#000').hex().replace('#', '0x')
      graphics.className = config.className
      graphics.lineStyle(config.strokeWidth, getColor(config.stroke), config.strokeOpacity)
      graphics.moveTo(x1, y1)
      graphics.lineTo(x2, y2)
      // 覆盖或追加
      if (container.children.length <= i) {
        container.addChild(graphics)
      } else {
        container.children[i] = graphics
      }
    })
  }
}

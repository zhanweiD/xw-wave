import * as d3 from 'd3'
import {isArray} from 'lodash'
import {Graphics} from 'pixi.js'
import chroma from 'chroma-js'

// 绘制一组曲线
export default function drawCurve({
  engine = 'svg',
  stroke = '#fff',
  opacity = 1,
  strokeOpacity = 1,
  strokeWidth = 1,
  curve = false,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  position = [], // 位置 [[[x,y]]]
  container,
  className,
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const lineGenerator = d3.line().x(d => d[0]).y(d => d[1])
  curve && lineGenerator.curve(d3[curve])
  const configuredData = position.map((data, i) => ({
    className,
    data,
    stroke: isArray(stroke) ? stroke[i] : stroke,
    opacity: isArray(opacity) ? opacity[i] : opacity,
    strokeOpacity: isArray(strokeOpacity) ? strokeOpacity[i] : strokeOpacity,
    strokeWidth: isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
    filter: isArray(filter) ? filter[i] : filter,
    mask: isArray(mask) ? mask[i] : mask,
    d: lineGenerator(data),
    source: source.length > i ? source[i] : null,
  }))
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('path')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('d', d => d.d)
      .attr('fill', 'none')
      .attr('opacity', d => d.opacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .attr('stroke-linecap', 'round')
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const graphics = new Graphics()
      const getColor = color => chroma(color || '#000').hex().replace('#', '0x')
      graphics.className = config.className
      graphics.lineStyle(config.strokeWidth, getColor(config.stroke), config.strokeOpacity)
      graphics.moveTo(config.data[0][0], config.data[0][1])
      for (let j = 1; j < config.data.length; j++) {
        graphics.lineTo(config.data[j][0], config.data[j][1])
      }
      // 覆盖或追加
      if (container.children.length <= i) {
        container.addChild(graphics)
      } else {
        container.children[i] = graphics
      }
    })
  }
}

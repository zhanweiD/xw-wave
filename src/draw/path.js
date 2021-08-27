import {isArray} from 'lodash'
import {Graphics} from 'pixi.js'
import chroma from 'chroma-js'

// 绘制一组自定义路径
export default function drawPath({
  engine = 'svg',
  fill = '#fff', // 颜色
  stroke = '#fff', // 描边
  strokeWidth = 0, // 描边粗细
  opacity = 1, // 不透明度
  fillOpacity = 1,
  strokeOpacity = 1,
  transform = null,
  transformOrigin = null, // 影响动画和旋转
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  data = [], // 数据需要适配生成器
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((item, i) => ({
    className,
    data: item,
    fill: isArray(fill) ? fill[i] : fill,
    stroke: isArray(stroke) ? stroke[i] : stroke,
    opacity: isArray(opacity) ? opacity[i] : opacity,
    fillOpacity: isArray(fillOpacity) ? fillOpacity[i] : fillOpacity,
    strokeOpacity: isArray(strokeOpacity) ? strokeOpacity[i] : strokeOpacity,
    strokeWidth: isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
    filter: isArray(filter) ? filter[i] : filter,
    mask: isArray(mask) ? mask[i] : mask,
    source: source.length > i ? source[i] : null,
    transform: isArray(transform) ? transform[i] : transform,
    transformOrigin: isArray(transformOrigin) ? transformOrigin[i] : transformOrigin,
  }))
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('path')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('d', d => d.data)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('opacity', d => d.opacity)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform-origin', d => d.transformOrigin)
      .style('transform', d => d.transform)
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      let origin = config.data.toUpperCase()
      const commands = ['M', 'L', 'H', 'V', 'C', 'S', 'Q', 'T', 'A', 'Z']
      commands.forEach(key => origin = origin.replace(new RegExp(key, 'g'), `#${key}#`))
      const sequence = origin.split('#').filter(Boolean)
      // 将 svg 的 path 命令映射到 canvas
      const graphics = new Graphics()
      const getColor = color => chroma(color || '#000').hex().replace('#', '0x')
      graphics.className = config.className
      graphics.lineStyle(config.strokeWidth, getColor(config.stroke), config.strokeOpacity)
      graphics.beginFill(getColor(config.fill), config.fillOpacity)
      // 开始绘制
      for (let j = 0; j < sequence.length && sequence[j] !== 'Z'; j += 2) {
        const command = sequence[j]
        const values = sequence[j + 1].trim().split(/[ ,]/).map(Number)
        if (command === 'M') { // 移动
          graphics.moveTo(...values)
        } else if (command === 'L') { // 直线
          graphics.lineTo(...values)
        } else if (command === 'C') { // 三次贝塞尔
          graphics.bezierCurveTo(...values)
        } else if (command === 'Q') { // 二次贝塞尔
          graphics.quadraticCurveTo(...values)
        } else {
          console.warn(`drawPath: Cannot support command '${command}'`)
        }
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

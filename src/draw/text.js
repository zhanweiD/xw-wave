import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../util/common'

// 文字方向映射
const directionMapping = {
  svg: {
    horizontal: 'horizontal-tb',
    vertical: 'vertical-rl',
  },
  canvas: {
    horizontal: 'ltr',
    vertical: 'rtl',
  },
}

// 绘制一组文本
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
  textShadow = '2px 2px 2px rgba(0,0,0,0)',
  writingMode = 'horizontal', // 文字方向 enumeration ['horizontal', 'vertical']
  transformOrigin = null, // 影响动画和旋转
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  data = [], // 文字数据
  position = [], // 直角坐标系坐标数据
  container, // 容器父节点
  className, // 用于定位 
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((text, i) => ({
    text,
    className,
    fontSize,
    fontFamily,
    fontWeight,
    x: position[i][0],
    y: position[i][1],
    fill: getAttr(fill, i),
    stroke: getAttr(stroke, i),
    opacity: getAttr(opacity, i),
    fillOpacity: getAttr(fillOpacity, i),
    strokeOpacity: getAttr(strokeOpacity, i),
    strokeWidth: getAttr(strokeWidth, i),
    filter: getAttr(filter, i),
    mask: getAttr(mask, i),
    rotation: getAttr(rotation, i),
    textShadow: getAttr(textShadow, i),
    transformOrigin: getAttr(transformOrigin, i),
    writingMode: directionMapping[engine][writingMode],
  }))

  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('text')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .text(d => d.text)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
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
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform', d => `rotate(${d.rotation}deg)`)
      .style('transform-origin', d => d.transformOrigin)
      .style('text-shadow', d => d.textShadow)
      .style('pointer-events', 'none')
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const text = new fabric.Text(config.text, {
        className: config.className,
        left: config.x,
        top: config.y - config.fontSize,
        fontSize: config.fontSize,
        fontFamily: config.fontFamily,
        fontWeight: config.fontWeight,
        fill: mergeAlpha(config.fill, config.fillOpacity),
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
        shadow: config.textShadow,
        direction: config.writingMode,
      })
      text.rotate(config.rotation)
      // 覆盖或追加
      if (container.getObjects().length <= i) {
        container.addWithUpdate(text)
      } else {
        container.item(i).set(text)
      }
    })
  }
}

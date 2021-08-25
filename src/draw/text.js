import {isArray} from 'lodash'

// 文字方向映射
const directionMapping = {
  horizontal: 'horizontal-tb',
  vertical: 'vertical-rl',
}

// 绘制一组文本
export default function drawText({
  fontFamily = '',
  fontSize = 12,
  fontWeight = 'normal',
  fill = 'rgba(255,255,255)',
  stroke = 'rgba(255,255,255)',
  strokeWidth = 0,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  rotation = 0,
  textShadow = '2px 2px 2px rgba(0,0,0,0)',
  writingMode = 'horizontal', // 文字方向 enumeration ['horizontal', 'vertical']
  textAnchor = 'start', // 文字锚点 enumeration ['start', 'middle', 'end']
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
    x: position[i][0],
    y: position[i][1] - fontSize * 0.2, // 这个数字为黑体的高度差
    fill: isArray(fill) ? fill[i] : fill,
    stroke: isArray(stroke) ? stroke[i] : stroke,
    opacity: isArray(opacity) ? opacity[i] : opacity,
    fillOpacity: isArray(fillOpacity) ? fillOpacity[i] : fillOpacity,
    strokeOpacity: isArray(strokeOpacity) ? strokeOpacity[i] : strokeOpacity,
    strokeWidth: isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
    filter: isArray(filter) ? filter[i] : filter,
    mask: isArray(mask) ? mask[i] : mask,
    fontFamily,
    fontWeight,
    fontSize: `${fontSize}px`,
    writingMode: directionMapping[writingMode],
    transform: `rotate(${isArray(rotation) ? rotation[i] : rotation}deg)`,
    transformOrigin: isArray(transformOrigin) ? transformOrigin[i] : transformOrigin,
    textAnchor: isArray(textAnchor) ? textAnchor[i] : textAnchor,
    textShadow,
  }))

  return container.selectAll(`.${className}`)
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
    .style('transform', d => d.transform)
    .style('transform-origin', d => d.transformOrigin)
    .style('text-shadow', d => d.textShadow)
    .style('text-anchor', d => d.textAnchor)
    .style('pointer-events', 'none')
}

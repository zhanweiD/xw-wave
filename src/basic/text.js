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
  fill = 'rgba(255,255,255,1)', // 可以是数组定义渐变色
  textShadow = '2px 2px 2px rgba(0,0,0,0)',
  opacity = 1,
  rotation = 0,
  direction = 'horizontal', // 文字方向 enumeration ['horizontal', 'vertical']
  textAnchor = 'start', // 文字锚点 enumeration ['start', 'middle', 'end']
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  data = [], // 文字数据
  position = [], // 直角坐标系坐标数据
  container, // 容器父节点
  className, // 用于定位 
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((text, i) => {
    return {
      text,
      className,
      x: position[i][0],
      y: position[i][1] - fontSize * 0.2, // 这个数字为黑体的高度差
      fill: Array.isArray(fill) ? fill[i] : fill,
      opacity,
      fontFamily,
      fontSize: `${fontSize}px`,
      fontWeight,
      textAnchor,
      writingMode: directionMapping[direction],
      transform: `rotate(${rotation})`,
      textShadow,
    }
  })

  const texts = container.selectAll(`.${className}`)
    .data(configuredData)
    .join('text')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .text(d => d.text)
    .attr('class', d => d.className)
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('fill', d => d.fill)
    .attr('opacity', d => d.opacity)
    .attr('font-family', d => d.fontFamily)
    .attr('font-size', d => d.fontSize)
    .attr('font-weight', d => d.fontWeight)
    .attr('text-anchor', d => d.textAnchor)
    .attr('writing-mode', d => d.writingMode)
    .style('transform', d => d.transform)
    .style('text-shadow', d => d.textShadow)
    .style('pointer-events', 'none')

  return texts
}

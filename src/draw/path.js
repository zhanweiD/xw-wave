import {isArray} from 'lodash'
import {fabric} from 'fabric'
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
  transformOrigin = null, // 影响动画和旋转
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  data = [], // 数据需要适配生成器
  position = [0, 0], // 图形相对位移
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((item, i) => ({
    className,
    path: item,
    fill: isArray(fill) ? fill[i] : fill,
    stroke: isArray(stroke) ? stroke[i] : stroke,
    opacity: isArray(opacity) ? opacity[i] : opacity,
    fillOpacity: isArray(fillOpacity) ? fillOpacity[i] : fillOpacity,
    strokeOpacity: isArray(strokeOpacity) ? strokeOpacity[i] : strokeOpacity,
    strokeWidth: isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
    filter: isArray(filter) ? filter[i] : filter,
    mask: isArray(mask) ? mask[i] : mask,
    source: source.length > i ? source[i] : null,
    transformOrigin: isArray(transformOrigin) ? transformOrigin[i] : transformOrigin,
    position: isArray(position) && isArray(position[0]) ? position[i] : position,
  }))
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('path')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('d', d => d.path)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('opacity', d => d.opacity)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform-origin', d => d.transformOrigin)
      .style('transform', d => `translate(${d.position[0]}px,${d.position[1]}px)`)
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const path = new fabric.Path(config.path, {
        className: config.className,
        fill: chroma(config.fill || '#000').alpha(config.fillOpacity),
        stroke: chroma(config.stroke || '#000').alpha(config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
      })
      // 整体位移
      path.left += config.position[0]
      path.top += config.position[1]
      // 覆盖或追加
      if (container.getObjects().length <= i) {
        container.addWithUpdate(path)
      } else {
        container.item(i).set(path)
      }
    })
  }
}

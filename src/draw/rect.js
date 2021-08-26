import {isArray} from 'lodash'
import {Graphics} from 'pixi.js'
import chroma from 'chroma-js'

// 绘制一组矩形
export default function drawText({
  engine = 'svg',
  fill = '#fff', // 可以是数组定义渐变色
  stroke = '#fff', // 可以是数组定义渐变色
  strokeWidth = 0,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  rotate = 0, // 旋转
  transformOrigin = 'center', // 影响动画和旋转
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  data = [], // 矩形宽高数据
  position = [], // 直角坐标系坐标数据
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((size, i) => {
    const [width, height] = size
    const [x, y] = position[i]
    return {
      className,
      x,
      y,
      width,
      height,
      rotate: isArray(rotate) ? rotate[i] : rotate,
      fill: isArray(fill) ? fill[i] : fill,
      stroke: isArray(stroke) ? stroke[i] : stroke,
      opacity: isArray(opacity) ? opacity[i] : opacity,
      fillOpacity: isArray(fillOpacity) ? fillOpacity[i] : fillOpacity,
      strokeOpacity: isArray(strokeOpacity) ? strokeOpacity[i] : strokeOpacity,
      strokeWidth: isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
      filter: isArray(filter) ? filter[i] : filter,
      mask: isArray(mask) ? mask[i] : mask,
      source: source.length > i ? source[i] : null,
      transformOrigin: getTransformOrigin({x, y, width, height, transformOrigin}),
    }
  })
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('rect')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform', d => `rotate(${d.rotate}deg)`)
      .style('transform-origin', d => d.transformOrigin)
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const graphics = new Graphics()
      const getColor = color => chroma(color || '#000').hex().replace('#', '0x')
      graphics.className = config.className
      graphics.lineStyle(config.strokeWidth, getColor(config.stroke), config.strokeOpacity)
      graphics.beginFill(getColor(config.fill), config.fillOpacity)
      graphics.drawRect(config.x, config.y, config.width, config.height)
      graphics.endFill()
      // 覆盖或追加
      if (container.children.length <= i) {
        container.addChild(graphics)
      } else {
        container.children[i] = graphics
      }
    })
  }
}

const getTransformOrigin = ({x, y, height, width, transformOrigin}) => {
  let result = transformOrigin
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

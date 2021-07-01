import chroma from 'chroma-js'
import {isArray, merge} from 'lodash'

// 工具布局到图表布局
const layoutMapping = type => {
  switch (type) {
    case 'text':
      return 'title'
    case 'legend':
      return 'legend'
    default:
      return 'main'
  }
}

// 工具对齐字段到图表对齐字段的映射
const alignMapping = align => {
  switch (align) {
    case 'left-top':
      return ['start', 'start']
    case 'center-top':
      return ['middle', 'start']
    case 'right-top':
      return ['end', 'start']
    case 'middle-left':
      return ['start', 'middle']
    case 'middle-center':
      return ['middle', 'middle']
    case 'middle-right':
      return ['end', 'middle']
    case 'left-bottom':
      return ['start', 'end']
    case 'center-bottom':
      return ['middle', 'end']
    case 'right-bottom':
      return ['end', 'end']
    default:
      return [null, null]
  }
}

// 删除无效值，因为无效值有特殊含义（采用默认值）
const filterInvalid = object => {
  Object.keys(object).forEach(key => {
    if (object[key] === undefined) {
      delete object[key]
    }
  })
  return object
}

// 多色二维数组到一维数组的转换
const getColor = fillColor => {
  if (isArray(fillColor)) {
    const result = []
    const format = number => Number(number).toFixed(2)
    fillColor.reduce(([prevColor, prevOffset], [curColor, curOffset]) => {
      const colors = chroma.scale([prevColor, curColor]).mode('lch').colors(format((curOffset - prevOffset) / 0.01))
      result.push(...colors)
      return [curColor, curOffset]
    })
    return result
  }
  return fillColor
}

// 图形面板配置映射
const graphMapping = graph => {
  const {
    useFill, // 启用填充
    fillColor, // 填充色
    fillOpacity, // 填充透明度
    useStroke, // 启用描边
    strokeWidth, // 描边宽度
    strokeColor, // 描边色
    strokeOpacity, // 描边透明度
  } = graph
  return filterInvalid({
    fill: useFill ? getColor(fillColor) : null,
    stroke: useStroke ? strokeColor : undefined,
    fillOpacity: useFill ? fillOpacity : undefined,
    strokeWidth: useStroke ? strokeWidth : undefined,
    strokeOpacity: useStroke ? strokeOpacity : undefined,
  })
}
  
// 文字面板配置映射
const textMapping = text => {
  const {
    fontFamily, // 字体
    fontSize, // 字号
    fontWeight, // 字重
    fillColor, // 填充色
    fillOpacity, // 填充透明度
    useShadow, // 使用阴影
    shadowConfig, // 阴影的参数
    shadowOpacity, // 阴影透明度
    shadowColor, // 阴影颜色
    useFormat, // 是否格式化
    useThousandth, // 是否格式化为千分位
    usePercentage, // 是否格式化为百分数
    decimalPlace, // 是否格式化为小数点后N位
    rotation, // 文字旋转角度
    writingMode, // 文字书写方向
  } = text
  const [x, y, blur] = shadowConfig
  const color = shadowColor.replace('rgb', 'rgba').replace(')', `,${shadowOpacity})`)
  return filterInvalid({
    fontFamily,
    fontSize,
    fontWeight,
    fill: fillColor,
    fillOpacity,
    rotation,
    writingMode,
    textShadow: useShadow ? `${x}px ${y}px ${blur}px ${color}` : undefined,
    format: {
      type: useFormat ? 'number' : 'plainText',
      decimalPlace,
      isPercentage: usePercentage,
      isThousandth: useThousandth,
    },
  })
}

// 其他面板的配置映射，每个图层都不同
const otherMapping = (layer, other) => {
  const scale = {}
  const options = {}
  const style = {...other}
  // 各个图层的数据处理
  if ((layer === 'text' || layer === 'legend') && other.alignment) {
    [style.align, style.verticalAlign] = alignMapping(other.alignment)
  } else if (layer === 'axis') {
    merge(options, {type: other.type})
  } else if (layer === 'radar') {
    merge(options, {mode: other.mode})
  } else if (layer === 'auxiliary') {
    const {
      type, // 水平线或垂直线
      dasharray, // 辅助线虚线参数
    } = other
    merge(style, {line: {dasharray: `${dasharray[0]} ${dasharray[1]}`}})
    merge(options, {type})
  } else if (layer === 'rect') {
    const {
      type, // 柱状图或者折线图
      mode, // 数据组合方式
      axis, // 坐标轴类型
      useFixedWidth, // 启用固定宽度
      fixedBandWidth, // 固定宽度
      useFixedPaddingInner, // 启用固定间距
      fixedPaddingInner, // 固定间距
      labelPositionMax,
      labelPositionMin,
    } = other
    merge(options, {type, mode, axis})
    merge(style, {labelPosition: [labelPositionMin, labelPositionMax]})
    merge(scale, {
      fixedBandWidth: useFixedWidth ? fixedBandWidth : null,
      fixedPaddingInner: useFixedPaddingInner ? fixedPaddingInner : null,
      fixedBoundary: 'start',
    })
  }
  filterInvalid(options)
  filterInvalid(style)
  return {options, scale, style}
}

// 动画面板映射
const animationMapping = animation => {
  const {
    useEnterAnimation, // 是否启用入场动画
    enterAnimationType, // 入场动画类型
    enterAnimationDuration, // 入场动画时间
    enterAnimationDelay, // 入场动画延时
    useLoopAnimation, // 是否启用轮播动画
    loopAnimationType, // 轮播动画类型
    loopAnimationDuration, // 轮播动画时间
    loopAnimationDelay, // 轮播动画延时
    useUpdateAnimation, // 是否启用数据更新动画
    updateAnimationDuration, // 数据更新动画时间
    updateAnimationDelay, // 数据更新动画延时
    ...extraConfig // 动画的其他配置
  } = animation
  // 计算动画非通用配置
  const extraEnterAnimation = {}
  const extraLoopAnimation = {}
  Object.keys(extraConfig)
    .filter(key => extraConfig[key] && key.includes('enterAnimation'))
    .forEach(key => extraEnterAnimation[key.split('.')[2]] = extraConfig[key])
  Object.keys(extraConfig)
    .filter(key => extraConfig[key] && key.includes('loopAnimation'))
    .forEach(key => extraLoopAnimation[key.split('.')[2]] = extraConfig[key])
  return {
    enterAnimation: useEnterAnimation && {
      type: enterAnimationType,
      duration: enterAnimationDuration,
      delay: enterAnimationDelay,
      ...extraEnterAnimation,
    },
    loopAnimation: useLoopAnimation && {
      type: loopAnimationType,
      duration: loopAnimationDuration,
      delay: loopAnimationDelay,
      ...extraLoopAnimation,
    },
    updateAnimation: useUpdateAnimation && {
      delay: updateAnimationDuration,
      duration: updateAnimationDelay,
    },
  }
}

export {
  layoutMapping,
  graphMapping,
  textMapping,
  otherMapping,
  animationMapping,
}

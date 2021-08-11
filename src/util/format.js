import * as d3 from 'd3'
import getTextWidth from './text-width'

// 数字格式化
export const formatNumber = (text, config) => {
  // 隐式格式化，消除计算误差
  if (!config) {
    if (text && !Number.isNaN(Number(text))) {
      return d3.format(`.${8}~f`)(text)
    }
    return text
  }
  // 显式格式化，由用户定义
  const {
    percentage = false, // 百分比数字
    thousandth = false, // 千分位数字
    decimalPlace = 8, // 保留小数位
  } = config
  return d3.format(`${thousandth ? ',' : ''}.${decimalPlace}~${percentage ? '%' : 'f'}`)(text)
}

// 文字溢出控制
export const overflowControl = (text, config) => {
  const {
    omit = true, // 省略号
    width = Infinity, // 最大宽度
    height = Infinity, // 最大高度
    fontSize = 12, // 基础字号
  } = config
  // 宽度溢出裁剪
  if (fontSize <= height && width < getTextWidth(text, fontSize)) {
    for (let i = text.length; i > 0; i--) {
      const subString = `${text.substring(0, i)}${omit ? '...' : ''}`
      if (width > getTextWidth(subString, fontSize)) {
        return subString
      }
    }
  }
  // 高度溢出隐藏
  if (fontSize > height) {
    return null
  }
  return text
}

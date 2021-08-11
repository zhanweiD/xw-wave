import * as d3 from 'd3'
import getTextWidth from './text-width'

const formatType = {
  PLAIN: 'plain', // 纯文本
  NUMBER: 'number', // 数字
}

export const formatNumber = (text, {
  type = formatType.PLAIN,
  percentage = false, // 百分比数字
  thousandth = false, // 千分位数字
  decimalPlace = 8, // 保留小数位
}) => {
  // 显式格式化，由用户定义
  if (type === formatType.NUMBER) {
    return d3.format(`${thousandth ? ',' : ''}.${decimalPlace}~${percentage ? '%' : 'f'}`)(text)
  } 
  // 隐式格式化，消除计算误差
  if (!Number.isNaN(Number(text))) {
    return d3.format(`.${decimalPlace}`)(text)
  }
  return text
}

// 文字溢出控制
export const overflowControl = (text, {
  omit = true, // 省略号
  width = Infinity, // 最大宽度
  height = Infinity, // 最大高度
  fontSize = 12, // 基础字号
}) => {
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

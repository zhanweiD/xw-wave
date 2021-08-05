import * as d3 from 'd3'
import getTextWidth from './text-width'

const formatType = {
  PLAIN: 'plain', // 纯文本
  NUMBER: 'number', // 数字
}

export default (text, format = {}) => {
  const {
    type = formatType.PLAIN,
    // 仅限数字
    isPercentage = false, // 百分比数字
    isThousandth = false, // 千分位数字
    decimalPlace = 8, // 保留小数位
    // 溢出控制仅适用于文本
    isOverflowControl = false,
    isOmit = true, // 省略显示
    width = Infinity, // 最大宽度
    height = Infinity, // 最大高度
    fontSize = 12, // 基础字号
  } = format

  // 格式化数值文字
  if (type === formatType.NUMBER) {
    return d3.format(`${isThousandth ? ',' : ''}.${decimalPlace}~${isPercentage ? '%' : 'f'}`)(text)
  }
  // 文字溢出降价处理
  if (isOverflowControl) {
    if (fontSize <= height && width < getTextWidth(text, fontSize)) {
      for (let i = text.length; i > 0; i--) {
        const subString = `${text.substring(0, i)}${isOmit ? '...' : ''}`
        if (width > getTextWidth(subString, fontSize)) {
          return subString
        }
      }
    } else if (fontSize > height) {
      return null
    }
  }

  return text
}

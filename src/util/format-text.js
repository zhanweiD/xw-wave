import * as d3 from 'd3'

// 格式化文本，对于数字型文本，千分位、百分比、保留小数位等设置会有影响
export default (text, format) => {
  const type = Array.isArray(format) ? format[0] : format
  const options = Array.isArray(format) ? format[1] : {}
  const {
    isPercentage = false, // 百分比数字
    isThousandth = false, // 千分位数字
    decimalPlace = 8, // 保留小数位
  } = options
  
  if (type === 'number') {
    return d3.format(`${isThousandth ? ',' : ''}.${decimalPlace}~${isPercentage ? '%' : 'f'}`)(text)
  }
  
  return String(text)
}
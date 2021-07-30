import * as d3 from 'd3'

// 格式化文本，对于数字型文本，千分位、百分比、保留小数位等设置会有影响
export default (text, format = {}) => {
  const {
    type = 'plainText',
    isPercentage = false, // 百分比数字
    isThousandth = false, // 千分位数字
    decimalPlace = 8, // 保留小数位
  } = format
  
  // 除了手动格式化，顺便消除浮点数丢失精度的问题
  if (type === 'number' || !Number.isNaN(Number(text))) {
    return d3.format(`${isThousandth ? ',' : ''}.${decimalPlace}~${isPercentage ? '%' : 'f'}`)(text)
  }  
  
  return String(text)
}

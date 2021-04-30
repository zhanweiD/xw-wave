// 十六进制颜色代码转换为rgb
export default hex => {
  if (!hex) {
    return ''
  }
  if (hex.charAt(0) === '#') {
    let color = hex.substring(1)
    if (color.length === 3) {
      color = color.replace(/(\w)(\w)(\w)/, '$1$1$2$2$3$3')
    }
    const reg = /\w{2}/g
    const colors = color.match(reg) || []
    for (let i = 0; i < colors.length; i++) {
      colors[i] = parseInt(colors[i], 16).toString()
    }
    return `rgb(${colors.join()})`
  }
  return hex
}

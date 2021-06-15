import * as d3 from 'd3'

// 随机生成函数
const mapping = {
  // 正态分布
  normal: ({mu, sigma}) => d3.randomNormal(mu, sigma),
  // 泊松分布
  poisson: ({lambda}) => d3.randomPoisson(lambda),
}

const toFixed = (number, decimal) => {
  return Math.round(number / 10 ** -decimal) / 10 ** decimal
}

// 列表类数据
const tableList = options => {
  const {mode, row, column, decimalPlace = 0} = options
  const getNumber = mapping[mode](options)
  const numbers = new Array(row * column).fill().map(() => toFixed(getNumber(), decimalPlace))
  const headers = ['维度'].concat(new Array(column).fill().map((v, i) => `第${i + 1}类`))
  const lists = new Array(row).fill().map((v, i) => [`第${i + 1}项`].concat(numbers.slice(i * column, (i + 1) * column)))
  return [headers, ...lists]
}

// 表格数据
const table = options => {
  const {mode, row, column, decimalPlace} = options
  const getNumber = mapping[mode](options)
  const numbers = new Array(row).fill().map(() => new Array(column).fill().map(() => toFixed(getNumber(), decimalPlace)))
  const rows = new Array(row).fill().map((v, i) => `第${i + 1}行`)
  const columns = new Array(column).fill().map((v, i) => `第${i + 1}列`)
  return [rows, columns, numbers]
}

export default {
  tableList,
  table,
}

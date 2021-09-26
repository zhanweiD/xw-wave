import * as d3 from 'd3'

const mapping = {
  normal: ({mu, sigma}) => d3.randomNormal(mu, sigma),
  poisson: ({lambda}) => d3.randomPoisson(lambda),
}

const toFixed = (number, decimal) => {
  return Math.round(number / 10 ** -decimal) / 10 ** decimal
}

const tableList = options => {
  const {mode, row, column, decimalPlace = 0} = options
  const getNumber = mapping[mode](options)
  const numbers = new Array(row * column).fill().map(() => toFixed(getNumber(), decimalPlace))
  const headers = ['dimension'].concat(new Array(column).fill().map((v, i) => `Class ${i + 1}`))
  const lists = new Array(row)
    .fill()
    .map((v, i) => [`Item ${i + 1}`].concat(numbers.slice(i * column, (i + 1) * column)))
  return [headers, ...lists]
}

const table = options => {
  const {mode, row, column, decimalPlace} = options
  const getNumber = mapping[mode](options)
  const numbers = new Array(row)
    .fill()
    .map(() => new Array(column).fill().map(() => toFixed(getNumber(), decimalPlace)))
  const rows = new Array(row).fill().map((v, i) => `Row ${i + 1}`)
  const columns = new Array(column).fill().map((v, i) => `Column ${i + 1}`)
  return [rows, columns, numbers]
}

export default {
  tableList,
  table,
}

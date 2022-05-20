import {isArray} from 'lodash'

const itemMap = item => {
  const node = []
  const link = []

  item.forEach(v => {
    if (isArray(v)) {
      v.forEach(c => {
        link.push([item[0], c])
      })
    } else {
      node.push(v)
    }
  })
  return [node, link]
}
const conversionData = data => {
  const nodes = []
  const links = []
  if (isArray(data)) {
    const [titles, ...values] = data
    const linkTitle = []
    values[0].forEach((i, idx) => {
      if (isArray(i)) {
        links.push(['from', titles[idx]])
      } else {
        linkTitle.push(titles[idx])
      }
    })
    linkTitle.length > 0 && nodes.push(linkTitle)
    values.forEach(i => {
      if (isArray(i)) {
        const source = itemMap(i, titles) 
        nodes.push(source[0])
        links.push(...source[1])
      }
    })
  }
  return [nodes, links]
}
export default conversionData

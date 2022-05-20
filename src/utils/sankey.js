import {isArray} from 'lodash'

const itemMap = (item, type) => {
  const node = []
  const link = []
  item.forEach((v, vdx) => {
    if (isArray(v)) {
      v.forEach(c => {
        link.push({
          [[type[vdx]]]: c,
        })
      })
    } else {
      node.push(v)
    }
  })
  const valueMap = link.filter(i => i.value)
  const toMap = link.filter(i => i.to)
  const links = valueMap.map((v, vdx) => {
    return [
      node[0],
      toMap[vdx].to,
      v.value,
    ]
  })
  return [node, links]
}
const sanKeyData = data => {
  const nodes = []
  const links = [['from']]
  if (isArray(data)) {
    const [titles, ...values] = data
    const linkTitle = []
    values[0].forEach((i, idx) => {
      if (isArray(i)) {
        links[0].push(titles[idx])
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
export default sanKeyData

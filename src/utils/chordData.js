import {isArray} from 'lodash'

const chordData = data => {
  const nodes = []
  const links = []
  const value = []
  if (isArray(data)) {
    const [, ...values] = data
    values.forEach(i => {
      if (isArray(i)) {
        value.push(i[2])
        nodes.push(i[0])
        links.push(i[1])
      }
    })
  }
  return [nodes, links, value]
}
export default chordData

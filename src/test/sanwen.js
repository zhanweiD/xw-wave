import {useEffect, useRef} from 'react'
import Wave from '../wave/wave'
import TableList from '../data/table-list'
import Scale from '../data/scale'

const createWave = container => {
  const wave = new Wave({container, theme: ''})
  const data = new TableList([
    ['省份', '数量'],
    ['北京', 66],
    ['天津', 30],
    ['河北', 61],
    ['山西', 33],
    ['内蒙古', 17],
    ['辽宁', 65],
    ['吉林', 37],
    ['黑龙江', 39],
    ['上海', 38],
    ['江苏', 77],
    ['浙江', 59],
    ['安徽', 45],
  ])

  const scaleX = new Scale({
    type: 'bind',
    domain: data.select('省份').data[0].list,
    range: [0, wave.layout.width],
  })
  const scaleGroupY = new Scale({
    type: 'bind',
    domain: data.select(['省份', '数量'], {mode: 'group'}).range(),
    range: [wave.layout.height, 0],
  })
  const scaleStackY = new Scale({
    type: 'bind',
    domain: data.select(['省份', '数量'], {mode: 'stack'}).range(),
    range: [wave.layout.height, 0],
  })

  const titleLayer = wave.createLayer('text')
  titleLayer.setData('这是一个标题')
  titleLayer.setStyle({
    text: {
      fontSize: 22,
    },
  })
  titleLayer.draw()
}

export default function Text() {
  const ref = useRef(null)
  useEffect(() => createWave(ref.current), [])
  return <div style={{flex: 1}} ref={ref} />
}

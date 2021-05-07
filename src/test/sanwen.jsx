import {useEffect, useRef} from 'react'
import Wave from '../wave'
import TableList from '../data/table-list'
import Scale from '../data/scale'

const createWave = container => {
  const wave = new Wave({container, theme: ''})
  const data = new TableList([
    ['年份', '中等专业学校', '成人中专', '职业高中', '技工学校'], 
    ['1985', 157.1, 0, 184.3, 74.2], 
    ['1990', 224.4, 158.8, 247.1, 133.2], 
    ['2000', 489.5, 169.3, 414.6, 140.1], 
    ['2005', 629.8, 112.5, 582.4, 275.3], 
    ['2007', 781.6, 113, 725.2, 367.1], 
    ['2009', 840.4, 161, 778.4, 398.8], 
    ['2011', 855.2, 238.7, 681, 430.4], 
    ['2013', 772.2, 230, 534.2, 386.6], 
    ['2015', 732.7, 162.7, 439.9, 321.5], 
    ['2016', 718.1, 141.2, 416.6, 323.2],
  ])

  const scaleX = new Scale({
    type: 'band',
    domain: data.select('年份').data[0].list,
    range: [0, wave.layout.main.width],
  })
  const scaleGroupY = new Scale({
    type: 'linear',
    domain: data.select(['中等专业学校', '成人中专', '职业高中', '技工学校'], {mode: 'group'}).range(),
    range: [wave.layout.main.height, 0],
    nice: {count: 5, zero: 0},
  })
  const scaleStackY = new Scale({
    type: 'linear',
    domain: data.select(['中等专业学校', '成人中专', '职业高中', '技工学校'], {mode: 'stack'}).range(),
    range: [wave.layout.main.height, 0],
  })

  console.log(scaleGroupY, scaleGroupY.domain(), scaleGroupY.range(), scaleGroupY(800))

  // 标题图层
  const titleLayer = wave.createLayer('text')
  titleLayer.setData('这是一个标题')
  titleLayer.setStyle({
    text: {
      fontSize: 22,
    },
  })
  titleLayer.draw()

  // 矩形图层
  const rectLayer = wave.createLayer('rect', {mode: 'group'})
  rectLayer.setLayout(wave.layout.main)
  rectLayer.setData(data.select(['年份', '中等专业学校']))
  rectLayer.setScale({
    scaleX,
    scaleY: scaleGroupY,
  })
  rectLayer.setStyle({labelPosition: 'top-outer'})
  rectLayer.draw()
}

export default function Text() {
  const ref = useRef(null)
  useEffect(() => createWave(ref.current), [])
  return <div style={{width: '100vw', height: '100vh'}} ref={ref} />
}

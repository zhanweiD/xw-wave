import {useEffect, useRef} from 'react'
import Wave from '../wave/wave'
import TableList from '../data/table-list'
import s from './demo.module.css'

const titleMapping = {
  pie: ['饼图', '环图'],
  nightingaleRose: ['蓝丁格尔玫瑰图', '环形蓝丁格尔玫瑰图'],
}

let pieWave
let donutWave
let nightingaleRoseWave
let donutNightingaleRoseWave

export default function Column({data = [[]], theme}) {
  const pieRef = useRef(null)
  const donutRef = useRef(null)
  const nightingaleRoseRef = useRef(null)
  const donutNightingaleRoseRef = useRef(null)
 
  useEffect(() => {
    pieWave = new Wave({container: pieRef.current, theme})
    donutWave = new Wave({container: donutRef.current, theme})
    nightingaleRoseWave = new Wave({container: nightingaleRoseRef.current, theme})
    donutNightingaleRoseWave = new Wave({container: donutNightingaleRoseRef.current, theme})
  }, [theme])

  useEffect(() => {
    updateWave({wave: pieWave, mode: 'default', data, type: 'pie', donut: false})
    updateWave({wave: donutWave, mode: 'stack', data, type: 'pie', donut: true})
    updateWave({wave: nightingaleRoseWave, mode: 'default', data, type: 'nightingaleRose', donut: false})
    updateWave({wave: donutNightingaleRoseWave, mode: 'stack', data, type: 'nightingaleRose', donut: true})
  }, [data, theme])
  
  return (
    <div className="fbh fb1 fbjsb fbw fbac">
      <div className={s.wave} ref={pieRef} />
      <div className={s.wave} ref={donutRef} />
      <div className={s.wave} ref={nightingaleRoseRef} />
      <div className={s.wave} ref={donutNightingaleRoseRef} />
    </div>
  )
}

// 分组柱状图
const updateWave = ({wave, data, type, mode, donut}) => {
  const tableList = new TableList(data)

  // 标题图层
  const titleLayer = wave.layer[0]?.instance || wave.createLayer('text', {layout: wave.layout.title})
  titleLayer.setData(donut ? titleMapping[type][1] : titleMapping[type][0])
  titleLayer.setStyle({
    text: {
      fontSize: 16,
    },
  })
  titleLayer.draw()

  // 圆弧图层
  const rectLayer = wave.layer[1]?.instance || wave.createLayer('arc', {mode, type, layout: wave.layout.main})
  const {width, height} = wave.layout.main
  const arcData = tableList.select(data[0].slice(0, 2))
  rectLayer.setData(arcData)
  rectLayer.setStyle({
    innerRadius: donut ? Math.min(width, height) / 10 : 0,
    arc: {
      enableUpdateAnimation: true,
    },
    text: {
      enableUpdateAnimation: true,
    },
  })
  rectLayer.draw()

  // 图例图层
  const legend = wave.layer[2]?.instance || wave.createLayer('legend', {layout: wave.layout.legend})
  legend.setData(data.slice(1).map(array => array[0]))
  legend.setStyle({
    align: 'end',
    verticalAlign: 'start',
    direction: 'vertical', 
    pointSize: 8,
    gap: [5, 0],
    text: {
      fontSize: 12,
      textShadow: '',
    },
  })
  legend.draw()
}

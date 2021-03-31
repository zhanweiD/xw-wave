import {useEffect, useRef} from 'react'
import Wave from '../wave/wave'
import TableList from '../data/table-list'
import Scale from '../data/scale'
import s from './demo.module.css'

const titleMapping = {
  group: '分组柱状图',
  stack: '堆叠柱状图',
  interval: '区间柱状图',
  waterfall: '瀑布柱状图',
}

let groupedColumnWave
let stackedColumnWave
let intervalColumnWave
let waterfallWave

export default function Column({data = [[]], type = 'column', theme}) {
  const groupedColumnRef = useRef(null)
  const stackedColumnRef = useRef(null)
  const intervalColumnRef = useRef(null)
  const waterfallRef = useRef(null)
 
  useEffect(() => {
    groupedColumnWave = new Wave({container: groupedColumnRef.current, theme, padding: [50]})
    stackedColumnWave = new Wave({container: stackedColumnRef.current, theme, padding: [50]})
    intervalColumnWave = new Wave({container: intervalColumnRef.current, theme, padding: [50]})
    waterfallWave = new Wave({container: waterfallRef.current, theme, padding: [50]})
  }, [theme])

  useEffect(() => {
    updateColumn({wave: groupedColumnWave, mode: 'group', data, type})
    updateColumn({wave: stackedColumnWave, mode: 'stack', data, type})
    updateColumn({wave: intervalColumnWave, mode: 'interval', data, type})
    updateColumn({wave: waterfallWave, mode: 'waterfall', data, type})
  }, [data, type, theme])
  
  return (
    <div className="fbh fb1 fbjsb fbw">
      <div className={s.wave} ref={groupedColumnRef} />
      <div className={s.wave} ref={stackedColumnRef} />
      <div className={s.wave} ref={intervalColumnRef} />
      <div className={s.wave} ref={waterfallRef} />
    </div>
  )
}

// 分组柱状图
const updateColumn = ({wave, data, type, mode}) => {
  let tableList = new TableList(data)
  if (mode === 'waterfall') {
    tableList = new TableList(data).select(data[0].slice(0, 2))
    tableList.push(['总和', tableList.select(data[0][1], {mode: 'sum', target: 'column'}).range()[1]])
  }

  const scaleX = new Scale({
    type: 'band',
    domain: tableList.select(data[0][0]).data[0].list,
    range: type === 'column' ? [0, wave.layout.main.width] : [0, wave.layout.main.height],
  })
  const scaleY = new Scale({
    type: 'linear',
    domain: tableList.select(data[0].slice(1), {mode: mode === 'stack' && 'sum'}).range(),
    range: type === 'column' ? [wave.layout.main.height, 0] : [0, wave.layout.main.width],
    nice: {count: 5, zero: true},
  })

  // 标题图层
  const titleLayer = wave.layer[0]?.instance || wave.createLayer('text')
  titleLayer.setData(titleMapping[mode])
  titleLayer.setStyle({
    text: {
      fontSize: 16,
    },
  })
  titleLayer.draw()
  // 矩形图层
  const rectLayer = wave.layer[1]?.instance || wave.createLayer('rect', {mode, type})
  rectLayer.setLayout(wave.layout.main)
  rectLayer.setData(tableList.select(data[0].slice(0)))
  rectLayer.setScale({scaleX, scaleY})
  rectLayer.setStyle({
    labelPosition: type === 'bar' ? ['left-outer', 'right-outer'] : ['bottom-outer', 'top-outer'],
    rect: {
      enableUpdateAnimation: true,
    },
    text: {
      fontSize: 8,
      enableUpdateAnimation: true,
    },
  })
  rectLayer.draw()
}

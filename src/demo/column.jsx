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
    groupedColumnWave = new Wave({container: groupedColumnRef.current, theme, padding: [0, 50, 30, 50]})
    stackedColumnWave = new Wave({container: stackedColumnRef.current, theme, padding: [0, 50, 30, 50]})
    intervalColumnWave = new Wave({container: intervalColumnRef.current, theme, padding: [0, 50, 30, 50]})
    waterfallWave = new Wave({container: waterfallRef.current, theme, padding: [0, 50, 30, 50]})
  }, [theme])

  useEffect(() => {
    updateColumn({wave: groupedColumnWave, mode: 'group', data, type})
    updateColumn({wave: stackedColumnWave, mode: 'stack', data, type})
    updateColumn({wave: intervalColumnWave, mode: 'interval', data, type})
    updateColumn({wave: waterfallWave, mode: 'waterfall', data, type})
  }, [data, type, theme])
  
  return (
    <div className="fbh fb1 fbjsb fbw fbac">
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
  const axisScaleX = new Scale({
    type: 'band',
    domain: scaleX.domain(),
    range: type === 'column' ? [0, wave.layout.axisX.width] : [0, wave.layout.axisX.height],
  })
  const axisScaleY = new Scale({
    type: 'linear',
    domain: scaleY.domain(),
    range: type === 'column' ? [0, wave.layout.axisY.height] : [0, wave.layout.axisX.width],
    nice: {count: 6},
  })

  // 标签轴图层
  const axisX = wave.layer[0]?.instance || wave.createLayer('axis')
  axisX.setLayout(type === 'column' ? wave.layout.axisX : wave.layout.axisY)
  axisX.setStyle({
    orient: type === 'column' ? 'bottom' : 'left',
    type: type === 'column' ? 'axisX' : 'axisY',
    label: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  axisX.setScale(axisScaleX)
  axisX.draw()

  // 数值轴图层
  const axisY = wave.layer[1]?.instance || wave.createLayer('axis')
  axisY.setLayout(type === 'column' ? wave.layout.axisY : wave.layout.axisX)
  axisY.setStyle({
    type: type === 'column' ? 'axisY' : 'axisX',
    orient: type === 'column' ? 'left' : 'bottom',
    tickLine: {
      opacity: 0.2,
    },
    label: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  axisY.setScale(axisScaleY)
  axisY.draw()

  // 标题图层
  const titleLayer = wave.layer[2]?.instance || wave.createLayer('text')
  titleLayer.setData(titleMapping[mode])
  titleLayer.setStyle({
    text: {
      fontSize: 16,
    },
  })
  titleLayer.draw()

  // 矩形图层
  const rectLayer = wave.layer[3]?.instance || wave.createLayer('rect', {mode, type})
  rectLayer.setLayout(wave.layout.main)
  rectLayer.setData(tableList.select(data[0].slice(0)))
  rectLayer.setScale({scaleX, scaleY})
  rectLayer.setStyle({
    labelPosition: type === 'bar' 
      ? ['left-outer', mode === 'stack' ? 'center' : 'right-outer'] 
      : ['bottom-outer', mode === 'stack' ? 'center' : 'top-outer'],
    rect: {
      enableUpdateAnimation: true,
    },
    text: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  rectLayer.draw()

  // 图例图层
  const legend = wave.layer[4]?.instance || wave.createLayer('legend')
  legend.setLayout(wave.layout.legend)
  legend.setData(tableList.data.map(({header}) => header).slice(1))
  legend.setStyle({
    align: 'end',
    verticalAlign: 'start',
    size: 5,
    gap: [5, 20],
    text: {
      fontSize: 14,
      textShadow: '',
    },
  })
  legend.draw()
}

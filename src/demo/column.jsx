import {useEffect, useRef} from 'react'
import Wave from '../wave'
import TableList from '../data/table-list'
import Scale from '../data/scale'
import s from './demo.module.css'

const titleMapping = {
  group: '分组图',
  stack: '堆叠图',
  interval: '区间图',
  waterfall: '瀑布图',
}

let groupedColumnWave
let stackedColumnWave
let intervalColumnWave
let waterfallWave
let drawCount = 0

export default function Column({data = [[]], type = 'column', theme}) {
  const groupedColumnRef = useRef(null)
  const stackedColumnRef = useRef(null)
  const intervalColumnRef = useRef(null)
  const waterfallRef = useRef(null)
 
  useEffect(() => {
    groupedColumnWave = new Wave({container: groupedColumnRef.current, theme})
    stackedColumnWave = new Wave({container: stackedColumnRef.current, theme})
    intervalColumnWave = new Wave({container: intervalColumnRef.current, theme})
    waterfallWave = new Wave({container: waterfallRef.current, theme})
  }, [theme, window.innerHeight, window.innerWidth])

  useEffect(() => {
    updateWave({wave: groupedColumnWave, mode: 'group', data, type})
    updateWave({wave: stackedColumnWave, mode: 'stack', data, type})
    updateWave({wave: intervalColumnWave, mode: 'interval', data, type})
    updateWave({wave: waterfallWave, mode: 'waterfall', data, type})
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
const updateWave = ({wave, data, type, mode}) => {
  let tableList = new TableList(data)
  if (mode === 'waterfall') {
    tableList = new TableList(data).select(data[0].slice(0, 2))
    tableList.push(['总和', tableList.select(data[0][1], {mode: 'sum', target: 'column'}).range()[1]])
  }

  const axisScaleX = new Scale({
    type: 'band',
    domain: tableList.select(data[0][0]).data[0].list,
    range: type === 'column' ? [0, wave.layout.axisX.width] : [0, wave.layout.axisX.height],
  })
  const axisScaleY = new Scale({
    type: 'linear',
    domain: tableList.select(data[0].slice(1), {mode: mode === 'stack' && 'sum'}).range(),
    range: type === 'column' ? [wave.layout.axisY.height, 0] : [0, wave.layout.axisX.width],
    nice: {count: 5, zero: true},
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
  const titleLayer = wave.layer[2]?.instance || wave.createLayer('text', {layout: wave.layout.title})
  titleLayer.setData(titleMapping[mode])
  titleLayer.setStyle({
    text: {
      fontSize: 16,
    },
  })
  titleLayer.draw()

  // 矩形图层
  const rectLayer = wave.layer[3]?.instance || wave.createLayer('rect', {mode, type, layout: wave.layout.main})
  rectLayer.setData(tableList.select(data[0].slice(0)))
  rectLayer.setStyle({
    labelPosition: type === 'bar' 
      ? ['left-outer', mode === 'stack' || mode === 'waterfall' ? 'center' : 'right-outer'] 
      : ['bottom-outer', mode === 'stack' || mode === 'waterfall' ? 'center' : 'top-outer'],
    rect: {
      enableUpdateAnimation: true,
    },
    text: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  rectLayer.draw()
  rectLayer.event.on('rect-click', d => console.log(d))
  rectLayer.event.on('text-click', d => console.log(d))
  const aniamtions = rectLayer.setAnimation({
    rect: {
      enterAnimation: {
        type: 'zoom',
        delay: 0,
        duration: 2000,
        mode: 'enlarge',
        direction: 'both',
      },
      // loopAnimation: {
      //   type: 'scan',
      //   delay: 1000,
      //   duration: 3000,
      //   color: 'rgba(255,255,255,0.5)',
      //   direction: type === 'bar' ? 'right' : 'top',
      // },
    },
    text: {
      enterAnimation: {
        type: 'fade',
        delay: 2000,
        duration: 1000,
        mode: 'fadeIn',
      },
    },
  })

  if (drawCount < 4) {
    aniamtions.rect.play()
    aniamtions.text.play()
    drawCount++
  }

  // 图例图层
  const legend = wave.layer[4]?.instance || wave.createLayer('legend', {layout: wave.layout.legend})
  legend.setData(tableList.data.map(({header}) => header).slice(1))
  legend.setStyle({
    align: 'end',
    verticalAlign: 'start',
    direction: 'horizontal', 
    pointSize: 8,
    gap: [5, 10],
    text: {
      fontSize: 12,
      textShadow: '',
    },
  })
  legend.draw()
}

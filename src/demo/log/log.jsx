import React, {useEffect, useRef} from 'react'
import {createChart} from '../../chart'
import s from './log.module.css'

const logData = [
  {
    type: 'timeline',
    options: {
      id: 'timeline',
      layout: 'main',
    },
    data: [
      ['time', 'event'],
      ['2020/10/22', '0.5.0 版本发布'],
    ],
    style: {},
  },
]

export default function Log() {
  const chartRef = useRef(null)

  useEffect(() => {
    createChart({
      container: chartRef.current,
      layers: logData,
    })
  }, [])

  return <div className={s.container} ref={chartRef} />
}

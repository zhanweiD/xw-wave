import {useEffect, useRef} from 'react'
import createWave from '../../chart/create'
import schema from '../schema'
import s from './side-bar.module.css'

const SearchBar = ({onSelect}) => {
  const ref = useRef(null)

  useEffect(() => {
    createWave({
      container: ref.current,
      layers: [
        {
          type: 'tabMenu',
          options: {
            id: 'tabMenu',
            layout: 'main',
          },
          data: schema,
          style: {
            text: {
              padding: '10px 0',
              height: '30px',
              width: '100%',
            },
            group: {
              width: ['120px', '180px'],
              backgroundColor: 'whitesmoke',
            },
          },
          event: {
            'click-tab': d => d.node.data.code && onSelect(d.node.data),
          },
        },
      ],
    })
  }, [])

  return (
    <div className={s.sideContainer}>
      <div ref={ref} className={s.menu} />
    </div>
  )
}

export default SearchBar

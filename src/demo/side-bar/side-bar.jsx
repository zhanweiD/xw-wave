import c from 'classnames'
import {useState} from 'react'
import schema from '../schema'
import s from './side-bar.module.css'

const SearchBar = ({defaultValue, onSelect}) => {
  const [activeKey, setActiveKey] = useState(defaultValue)

  return (
    <div className={s.sideContainer}>
      {Object.entries(schema).map(([key, value]) => (
        <div
          key={key}
          className={c(s.button, {[s.buttonActive]: activeKey === key})}
          onClick={() => {
            setActiveKey(key)
            onSelect(key)
          }}
        >
          {value.text}
        </div>
      ))}
    </div>
  )
}

export default SearchBar

import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Demo from './demo'
import './index.css'

import Wave from './wave'
import Layer from './layer'
import Animation from './animation'
import layout from './layout'
import draw from './draw'

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Route exact path="/" render={() => <Demo />} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

export default Wave
export {Layer, Animation, layout, draw}

import React from 'react'
import ReactDOM from 'react-dom'
import {HashRouter as Router, Route} from 'react-router-dom'
import Demo from './demo/demo'
import DemoOld from './demo/backup'
import Log from './demo/log'
import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Route exact path="/" render={() => <Demo />} />
      <Route exact path="/old" render={() => <DemoOld />} />
      <Route exact path="/log" render={() => <Log />} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

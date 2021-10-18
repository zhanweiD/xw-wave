import React from 'react'
import ReactDOM from 'react-dom'
import {HashRouter as Router, Route} from 'react-router-dom'
import Demo from './demo'
import DemoOld from './demo-old'
import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Route exact path="/" render={() => <Demo />} />
      <Route exact path="/old" render={() => <DemoOld />} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

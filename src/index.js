import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Root from './demo/root'
import Log from './demo/log'
import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Route exact path="/" render={() => <Root />} />
      <Route exact path="/log" render={() => <Log />} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

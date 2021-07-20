import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Demo from './demo'
import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Route exact path="/" render={() => <Demo />} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

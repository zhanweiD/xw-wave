import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Text1 from './test/sanwen'
import Text2 from './test/qiongfang'
import Text3 from './test/nanfeng'
import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Route path="/" component={Text1} />
      <Route path="/qiongfang" component={Text2} />
      <Route path="/nanfeng" component={Text3} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

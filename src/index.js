import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Demo from './demo'
import Demo2 from './demo2'
import Text1 from './test/sanwen'
import Text2 from './test/qiongfang'
import Text3 from './test/nanfeng'
import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Route exact path="/" render={() => <Demo2 />} />
      <Route path="/old" render={() => <Demo />} />
      <Route path="/sanwen" render={() => <Text1 />} />
      <Route path="/qiongfang" render={() => <Text2 />} />
      <Route path="/nanfeng" render={() => <Text3 />} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

import React, { useEffect, useState } from 'react'
import { Switch, Route } from 'react-router-dom'
import HicetnuncContextProvider from './context/HicetnuncContext'
import  MeshContextProvider  from './context/MeshContext';
import { getInitialData } from './data/api'
import { Header } from './components/header'
import { Loading as Preloading } from './components/loading'
import { FeedbackComponent } from './components/feedback'
import { routes } from './routes'

const App = () => {
  const [loading, setLoading] = useState(true)

  // 1st time loading the site ???
  useEffect(() => {
    getInitialData().then(() => {
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <Preloading />
  }

  return (
    <HicetnuncContextProvider>
      <MeshContextProvider>
        <Header />
        <FeedbackComponent />
        <Switch>
          {routes.map(({ exact, path, component: Comp }) => (
            <Route path={path} exact={exact} key={path} component={Comp} />
          ))}
        </Switch>
      </MeshContextProvider> 
    </HicetnuncContextProvider>
  )
}

export default App

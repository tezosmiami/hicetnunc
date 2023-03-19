/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect } from 'react'
import { useHistory } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import  { useMeshContext } from '../../context/MeshContext'
import { getItem, setItem } from '../../utils/storage'
import { Footer } from '../footer'
import { Padding } from '../layout'
import { Button, Primary } from '../button'
import { fadeIn } from '../../utils/motion'
import { Menu } from '../icons'
import { walletPreview } from '../../utils/string'
import { VisuallyHidden } from '../visually-hidden'
import styles from './styles.module.scss'
import { Bidou } from '../bidou'

/* import { BeaconWallet } from '@taquito/beacon-wallet'

const wallet = new BeaconWallet({
  name: 'hicetnunc.xyz',
  preferredNetwork: 'mainnet',
}) */

export const Header = () => {
  const history = useHistory()
  const context = useContext(HicetnuncContext)
  const mesh = useMeshContext()
  // let root = document.documentElement
  // const color = root.style.getPropertyValue('--background-color')
  // console.log(color)
  useEffect(() => {
    context.setAccount()
    context.setTheme(getItem('theme') || context.theme)
  }, [])

  // we assume user isn't connected
  let button = 'sync'

  // but if they are
  if (context.acc?.address) {
    // is menu closed?
    if (context.collapsed) {
      const proxyAddress = context.proxyAddress ? ` (${context.proxyName || walletPreview(context.proxyAddress)})` : ''
      button = walletPreview(context.acc.address) + proxyAddress
    } else {
      // menu is open
      button = 'unsync'
    }
  }

  //const activeAccount = await wallet.client.getActiveAccount()
  //console.log(activeAccount)
  const handleRoute = (path, data) => {
    context.setMenu(true)
    history.push(path, data)
  }


  const handleSyncUnsync = () => {
    if (context.acc?.address && !context.collapsed) {
      // disconnect wallet
      context.disconnect()
      mesh.meshed && handleMeshUnmesh()
    } else {
      // connect wallet
      context.syncTaquito()
    }
  }
  const handleMeshUnmesh = () => {
    !mesh.meshed ? setItem('syncmesh', true) : setItem('syncmesh', false)
    mesh.setMeshed(meshed => !meshed)
    mesh.meshed && mesh.peer.current.destroy()
  } 

  return (
    <>
      <header className={styles.container}>
        <div className={styles.content}>
        <Button onClick={() => handleRoute('/')}>
            <div className={styles.logo}>
              {/* HIC LOGO */}
              {true && (
                <svg viewBox="0 0 196.87 53.23" fill='var(--text-color)'>
                  <path
                    d="M228.9,79.31H211.51a2.26,2.26,0,0,1-.35-.34.75.75,0,0,1-.16-.42c0-11.42,0-22.85,0-34.43H193.24v35H175.41V26.27H228.9Z"
                    transform="translate(-32.03 -26.27)"
                    
                  />
                  <path
                    d="M67.74,43.78V26.42H85.41V79.19H67.91V62.38a4.24,4.24,0,0,0-.52-.57.77.77,0,0,0-.42-.17H50V79.08H32V26.48H49.78v17.3Z"
                    transform="translate(-32.03 -26.27)"
                  />
                  <path
                    d="M103.62,43.79V26.43h53.6c.09,5.62,0,11.41.05,17.36Z"
                    transform="translate(-32.03 -26.27)"
                  />
                  <path
                    d="M103.71,61.71h53.38V78.84c-4.05.69-38.16.91-53.38.31Z"
                    transform="translate(-32.03 -26.27)"
                  />
                </svg>
              )}
              {/* PRIDE LOGO */}
              {false && <img src="/hen-pride.gif" alt="pride 2021" />}
            </div>
          </Button>

          <div className={styles.right}>
            {!context.collapsed && context.proxyAddress && (
              <div className={styles.mr}>
                <Button onClick={() => context.setProxyAddress(null)} secondary>
                  <Primary>exit collab</Primary>
                </Button>
              </div>
            )}

            <Button onClick={handleSyncUnsync} secondary>
              <Primary>{button}</Primary> {/* Main address display here */}
            </Button>
            {context.acc?.address && !context.collapsed && '/'}
            {context.acc?.address && !context.collapsed && <Button onClick={handleMeshUnmesh} secondary>
            <Primary>{mesh.meshed ? 'unmesh' : 'mesh'}</Primary>
            </Button>}
            <Button onClick={context.toogleNavbar} secondary>
              <VisuallyHidden>
                {`${context.collapsed ? 'show' : 'hide'} menu`}
              </VisuallyHidden>
              <Menu isOpen={!context.collapsed} />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {!context.collapsed && (
          <motion.div className={styles.menu} {...fadeIn()}>    
              <Padding>
                <nav className={styles.content} >
                  <ul>
                    <li>
                      <Button onClick={() => handleRoute('/')}>
                        <Primary>explore</Primary>
                      </Button>
                    </li>
                    <li>
                      <Button onClick={() => handleRoute(window.location.href.includes('.live') ? '/lobby' : '/live')}>
                      <Primary>
                          live<span style={{ fontSize: '18px' }}> (lobby)</span>
                        </Primary>
                      </Button>
                    </li>
                    <li>
                      <Button onClick={() => handleRoute('/mint')}>
                        <Primary>
                          OBJKT<span style={{ fontSize: '18px' }}> (mint)</span>
                        </Primary>
                      </Button>
                    </li>
                    {mesh.alias?.length > 0   && mesh.alias?.length < 36 &&
                     <li>
                      <Button onClick={() => handleRoute(`/${mesh.alias}/live`)}>
                      <Primary>
                          start session
                        </Primary>
                      </Button>
                    </li>}
                    {/* <li>
                      <Button onClick={() => handleRoute('/collaborate')}>
                        <Primary>collaborate</Primary>
                      </Button>
                    </li> */}
                    <li>
                      <Button onClick={() => handleRoute('/sync', 'tz')}>
                        <Primary>manage assets</Primary>
                      </Button>
                    </li>
                    {context.acc?.address ?
                      <li>
                        <Button onClick={() => handleRoute('/config')}>
                          <Primary>edit profile</Primary>
                        </Button>
                      </li>
                      :
                      null
                    }
                   
                    <li>
                      <Button onClick={() => handleRoute('/galleries')}>
                        <Primary>galleries</Primary>
                      </Button>
                    </li>
                    <li>
                      <Button onClick={() => handleRoute('/sync', 'friends')}>
                        <Primary>friends</Primary>
                      </Button>
                    </li>
                    <li href="henradio.xyz">
                      <Button onClick={() => window.open('https://henradio.xyz', '_self', 'noopener,noreferrer')}>
                        <Primary>radio</Primary>
                      </Button>
                    </li>
                    <li>
                      <Button onClick={() => handleRoute('/about')}>
                        <Primary>about</Primary>
                      </Button>
                    </li>

                    <li>
                      <Button onClick={() => handleRoute('/faq')}>
                        <Primary>faq</Primary>
                      </Button>
                    </li>
                  </ul>
               
                </nav>
                
              </Padding>
              <Bidou></Bidou>
           
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

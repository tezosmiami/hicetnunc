import React, { useState, useEffect, useContext } from 'react'
import { Page } from '../../components/layout'
import { Ch3ss } from '../../components/games/chess'
import { NeonSwitch } from '../../components/neon-switch'
import { useMeshContext } from '../../context/MeshContext'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { Button, Primary } from '../../components/button'
import { Container } from '../../components/layout'
import { walletPreview } from '../../utils/string'
import { setItem } from '../../utils/storage'
import styles from './styles.module.scss'

export const Gaming = () => {
    const [invites, setInvites] = useState([])
    const [pvp, setPvp] = useState(null)
    const [move, setMove] = useState([])
    const [side, setSide] = useState('white')
    const [playing, setPlaying] = useState([])
    const [loading, setLoading] = useState(true)
    const {peer, alias, dimension, setDimension, online, setOnline, meshed, setMeshed, setLobby, onClose, onDimension} =  useMeshContext()
    const { acc, syncTaquito} = useContext(HicetnuncContext)
    

    useEffect(() => {
      const updateConn =  () => {
      if (meshed && peer.current) {
        onIncoming()
        online.filter((o) => (o.dimension === 'chess') && o.alias !== alias).map((s) =>  {
              s.conn && s.conn.off('data')
              onData(s.conn)
              s.conn.off('close')
              s.conn.on('close', () => {
                onClose(s.conn)
                pvp?.conn.id === s.conn.id && setPvp(null)
              })
           })
          }
       }
    updateConn()
    }, [meshed, online, invites, pvp, playing]);

  useEffect (() => {
      setDimension('chess')
      setLoading(false)
    return () => {
        setDimension('hicetnunc')
    }
  }, [])

    const onIncoming = () => {
        peer.current.off('connection')
        peer.current.on('connection', (conn) => {
          conn.on('open', () => {
            console.log('connected with', conn.peer)
            conn.send({ type: 'new',
                        alias: alias,
                        dimension: dimension,
                        playing: playing,
                        id: peer.current.id,
               })
            !online.find(o => o.id === conn.peer)
             && setOnline(online => [{
              alias: conn.metadata.alias,
              id: conn.peer,
              dimension: conn.metadata.dimension,
              conn: conn}, ...online ])
            onData(conn)
            conn.on('error', (e) => {
              console.log('error: ', e)
            })
            conn.on('close', () => {
              onClose(conn)
              pvp?.conn.id === conn.id && setPvp(null)
            })
            conn.peerConnection.oniceconnectionstatechange = () => {
              if(conn.peerConnection.iceConnectionState === 'disconnected') {
               onClose(conn)
               pvp?.conn.id === conn.id && setPvp(null)
             }
            }
          }) 
        })
      }

    const newConn = (conn, data) => {    
        setOnline(online => !online.find(o => o.id === data.id) ?
        [{alias:data.alias,
          id: conn.peer,
          dimension: data.dimension,
          conn:conn} , 
              ...online]
          : online)
          data.lobby && setLobby(data.lobby)    
          data.playing && setPlaying(data.playing)
       }

    const invite = (_alias) => {
      !invites.find(i => i.to?.alias === _alias) ? setInvites(i => [...i, {to:  {alias: _alias}}])
        : setInvites(i => i.filter(f => f.to?.alias !== _alias))
        online.forEach(o => o.alias === _alias
           && o.conn.send({
                  type: 'invite',
                  from: {alias, id: peer.current.id},
                  dimension: dimension
        })
      )
    }

    const onInvite = (data) => {
      !invites.find(i => i.from?.id === data.from?.id) ? setInvites(i => [...i, data])
        : setInvites(i => i.filter(f => f.from?.id !== data.from?.id))
      const favicon = document.getElementById("favicon")
      favicon.href = '/message.ico'
    }
    
    const accept = (_alias) => {
        let randomSide = Math.floor(Math.random() * 2) == 0 ? 'white' : 'black'
        setSide(randomSide)
        let id = invites.find(i => i.from?.alias === _alias).from.id
        let conn = online.find(o => o.id === id).conn
        conn.send({ type: 'accept',
                    alias: alias,
                    id: peer.current.id,
                    dimension: dimension,
                    side: (randomSide === 'black') ? 'white' : 'black'
          })
        setSide(randomSide)
        setPvp({
          game: 'chess',
          vs: conn.metadata.alias,
          conn: conn,
         })
         setInvites([])
         setPlaying(p => [...p, alias])
         online.forEach(o =>
            o.dimension === 'chess'
            && o.alias !== alias
            && o.conn?.send({
                type: 'playing',
                alias: alias,
                dimension: dimension,
          })
        )  
    } 
    
    const onAccept = (data) => {
      setSide(data.side)
      setPlaying(p => [...p, alias])
      online.forEach(o =>
          o.dimension === 'chess'
          && o.alias !== alias
          && o.conn?.send({ type: 'playing',
                            alias: alias,
                            id: peer.current.id,
                            dimension: dimension,
                          })
                        )  
      setPvp({
        game: 'chess',
        vs: data.alias,
        conn: online.find(o => o.id === data.id).conn
       })
      setInvites([])
      const favicon = document.getElementById("favicon")
      favicon.href = '/message.ico'
    }

    const onMove = (move) => {
      setMove(move)
      const favicon = document.getElementById("favicon")
      favicon.href = '/message.ico'
    }

    const onPlay = (_alias) => {
      playing.includes(_alias) ? setPlaying(p => p.filter(f => f !== _alias))
        : setPlaying(p => [...p, _alias])
    }

    const onForfit = (id) => {
      pvp.conn.peer === id && setPvp(null)
      setPlaying(p => p.filter(f => f !== alias))
      online.forEach(o =>
          o.dimension === 'chess'
          && o.alias !== alias
          && o.conn?.send({
              type: 'playing',
              alias: alias,
              id: peer.current.id,
              dimension: dimension,
            })
          )  
    }

    const onData = (conn) => {
        conn && conn.on('data', async (data) => {
          if (data.type === 'new') newConn(conn, data)
          if (data.lobby) setLobby(data.lobby)    
          if (data.type === 'dimension') {
             onDimension(data.id, data.dimension);
             setInvites(invites.filter(i => i.to?.alias !== data.alias || i.from?.id === data.id))
            }
          if (data.type === 'invite') onInvite(data)
          if (data.type === 'accept') onAccept(data)  
          if (data.type === 'playing') onPlay(data.alias) 
          if (data.type === 'again') onInvite(data)        
          if (data.type === 'move' && data.id === pvp.conn.peer) onMove(data.move)
          if (data.type === 'forfit' && data.id === pvp.conn.peer) onForfit(conn.peer)                  
        })
    }


    return(
        <Page>
            {!loading && !acc &&<div className={styles.online}>
                <Button onClick={async () => {await syncTaquito(); setMeshed(true)}}>
                  <Primary>
                  sync/mesh to play vs peer 
                  </Primary>
                </Button>
              </div>}
            {!loading && acc && !meshed && <div className={styles.online}>
              <Button onClick={()=> {setMeshed(true); setItem('syncmesh', true)}}>
                  <Primary>
                    mesh to play vs peer
                  </Primary>
              </Button>
              </div>} 
            {!loading && meshed && pvp && <div className={styles.online}>
              <div className={styles.vs}> 
                <span className={styles.ascii}>{side === 'black' ? `♟ `  : `♙ `}</span>&nbsp;
                <span> {alias.length === 36 ? walletPreview(alias) : alias} </span> 
              </div>
              <div className={styles.vs}> 
                <span className={styles.ascii}>{side === 'black' ? `♙ `  : `♟ `}</span>&nbsp;
                <span>{pvp.vs.length === 36 ? walletPreview(pvp.vs) : pvp.vs}</span>
              </div>
            </div>}
            {!loading && meshed && !pvp && <div className={styles.online}>
                {[...new Map(online.filter((o) => o.dimension === 'chess').map((m) => [m.alias, m])).values()].map((o,i) => (
                  o.alias !== alias
                     ? <Button key ={i} onClick={() => invites.find(f => f.from?.alias === o.alias)
                       ? accept(o.alias) : invite(o.alias)}> 
                        <div className={styles.tooltip}>
                           {invites.find(f => f.from?.alias === o.alias) && ' ¿'}
                           {o.alias?.length === 36 ? walletPreview(o.alias) : o.alias}
                           {invites.find(f => f.from?.alias === o.alias) && '?'}
                          <span className= {styles.tooltiptext}>
                          {!invites.find(f => f.to?.alias === o.alias || f.from?.alias === o.alias) ? 'invite'
                               : invites.find(f => f.to?.alias === o.alias)  ? 'uninvite' : 'accept'}
                          </span>
                        </div>
                      </Button>
                        : <span key={i} style={{display: 'flex', paddingTop: '9px'}}> 
                            {o.alias?.length === 36 ? walletPreview(o.alias) : o.alias}
                          </span>
                    ))}
                </div>}
            <Container>
              <div className={styles.neon}>
                  <NeonSwitch />  
              </div>
              <Ch3ss
                pvp={pvp}
                setPvp= {setPvp}
                move={move}
                setMove={setMove}
                side={side}
                setSide={setSide}
                playing={playing}
                setPlaying={setPlaying}
                invites={invites}
              />
            </Container>
          </Page>
        )
}



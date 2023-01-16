import React, { useContext, useEffect, useState, useRef, useCallback } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { useMeshContext } from '../../context/MeshContext'
import { fetchGraphQL } from '../../data/hicdex'
import { useHistory } from 'react-router'
import { fetchTag } from '../search'
import { renderMediaType } from '../../components/media-types'
import { setItem } from '../../utils/storage'
import { Page } from '../../components/layout'
import { Button, Primary } from '../../components/button'
import { Textarea } from '../../components/input'
import { walletPreview } from '../../utils/string'
import { Purchase } from '../../components/button'
import { Link, useParams } from 'react-router-dom'
import { Visualiser } from '../../components/media-types/audio/visualiser'
import { getRestrictedAddresses, fetchCollection} from '../../components/objkt-select'
import { PATH } from '../../constants'
import { Footer } from '../../components/footer'
import styles from './styles.module.scss'
import Select  from '../../components/objkt-select'

const pattern = new RegExp('^(https?://)?'+ // protocol
'((([a-z\\d]([a-z\\d-]*[a-z\\d])?)\\.)+[a-z]{2,}|'+ // domain name
'((\\d{1,3}\.){3}\\d{1,3}))'+ // OR ip (v4) address
'(:\\d+)?(/[-a-z\\d%_.~+]*)*'+ // port and path
'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
'(#[-a-z\\d_]*)?$','i'); // fragment locater

const query_objkt = `
  query objkt($id: bigint!) {
    hic_et_nunc_token_by_pk(id: $id) {
      id
      mime
      display_uri
      description
      artifact_uri
      thumbnail_uri
      title
      swaps(order_by: {price: asc}, limit: 1, where: {amount_left: {_gte: "1"}, contract_version: {_eq: "2"}, status: {_eq: "0"}}) {
        price
        id
      }
      creator{
        name
        address
      }
    }
  }
`

const getCollection = async (address) => {
  let offset = 0
  let collection = await fetchCollection(address, offset)
  while (collection.length % 500 === 0) {
    offset = offset+500
    collection = collection.concat(await fetchCollection(address, offset))
  }
  let list = await getRestrictedAddresses()
  let result = collection.filter(e => !list.includes(e.token.creator.address))
  return result
}
const Audio = ({media, alias }) => {
  const visualiser = useRef();
  const [play, setPlay] = useState(true)
  useEffect(() => {
    if (media.alias === alias) {
      play ? media.stream.getAudioTracks()[0].enabled = true
        : media.stream.getAudioTracks()[0].enabled = false
    }
    if (visualiser.current) {
      visualiser.current.init()
      if (play) {
        visualiser.current.audioCtx.state === 'suspended' ? setPlay(false) :
        visualiser.current.play()
      } else {
        visualiser.current.pause()
      }
    }
  }, [play, visualiser])

  return (
    <div className={styles.audioStream}>
       
        <div className={styles.icons} onClick={() => setPlay(!play)}>
          {play ? <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="32" d="M320 320c9.74-19.38 16-40.84 16-64 0-23.48-6-44.42-16-64m48 176c19.48-33.92 32-64.06 32-112s-12-77.74-32-112m48 272c30-46 48-91.43 48-160s-18-113-48-160"></path><path d="M125.65 176.1H32v159.8h93.65L256 440V72L125.65 176.1z"></path></svg>
            : <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="32" d="M416 432L64 80"></path><path d="M352 256c0-24.56-5.81-47.88-17.75-71.27L327 170.47 298.48 185l7.27 14.25C315.34 218.06 320 236.62 320 256a112.91 112.91 0 01-.63 11.74l27.32 27.32A148.8 148.8 0 00352 256zm64 0c0-51.19-13.08-83.89-34.18-120.06l-8.06-13.82-27.64 16.12 8.06 13.82C373.07 184.44 384 211.83 384 256c0 25.93-3.89 46.21-11 65.33l24.5 24.51C409.19 319.68 416 292.42 416 256z"></path><path d="M480 256c0-74.26-20.19-121.11-50.51-168.61l-8.61-13.49-27 17.22 8.61 13.49C429.82 147.38 448 189.5 448 256c0 48.76-9.4 84-24.82 115.55l23.7 23.7C470.16 351.39 480 309 480 256zM256 72l-73.6 58.78 73.6 73.59V72zM32 176.1v159.8h93.65L256 440V339.63L92.47 176.1H32z"></path></svg>
          }
           <span>-{media.alias.length===36 ? walletPreview(media.alias) : media.alias}</span>
         </div>
        
        {media.alias !== alias && <Visualiser style={{width: '108px'}} ref={visualiser} src={media.stream}/>}
    </div>
  );
}

async function fetchObjkt(id) {
  const { errors, data } = await fetchGraphQL(query_objkt, 'objkt', { id })
  if (errors) {
    console.error(errors)
  }
  const result = data.hic_et_nunc_token_by_pk
  return result
}

export const Live = () => {
  const [message, setMessage] = useState();
  const [objkt, setObjkt] = useState(0)
  const [conversation, setConversation] = useState([]);
  const [invitations, setInvitations] = useState([])
  const [collapsed, setCollapsed] = useState(true)
  const [audioStream, setAudioStream] = useState(false)
  const { acc, collect, syncTaquito} = useContext(HicetnuncContext)
  const { id:channel } = useParams()
  const scrollTarget = useRef(null)
  const history = useHistory()

  const {peer, alias, dimension, setDimension, media, setMedia, online, setOnline, meshed, setMeshed, calls, setCalls, onClose, onStream} =  useMeshContext()

  const onAudio = (id) => {
      const call = peer.current.call(id, media.find(m=> m.alias===alias).stream, {metadata: {alias:alias, dimension: dimension, invites:invitations}})  
      call.peerConnection.oniceconnectionstatechange = () => {
        if(call.peerConnection.iceConnectionState == 'disconnected') {
          setCalls(c => c.filter(i => i !== call))
        } 
      }
      setCalls(calls => [...calls, call])
  }

  const onInvite = (m) => {
    const invite = (message || m)?.split('/invite')[1].split(' ')[1]
    const invites = online.filter(o => o.dimension === dimension && o.alias !== alias)
    if (invites.length > 0) {
      !invitations.includes(invite) ? setInvitations(invitations => [...invitations, invite])
      : setInvitations(invitations => invitations.filter(i => i !== invite))
        invites.map(i => i.conn.send(
          {
            type: 'invite',
            invite: invite,
            alias: alias,
            dimension: dimension
        })
      )
    }
  }  

  const onCall = () => {
    peer.current.off('call')
    peer.current.on('call', (call) => {
      dimension !== alias && setInvitations(call.metadata.invites)
      if ((dimension === call.metadata.alias) || invitations.includes(call.metadata.alias)) {
        call.answer();
        console.log('audio from', call.peer)
        call.peerConnection.oniceconnectionstatechange = () => {
          if(call.peerConnection.iceConnectionState == 'disconnected') {
            setMedia(media => media.filter(m => m.alias !== call.metadata.alias))
            setCalls(calls => calls.filter(c => c.peer !== call.peer))
          } 
        }
        call.on('stream', stream => onStream({s: stream, a:call.metadata.alias}))
        setCalls(calls => [...calls, call])
        sendMessage('/')
      }  
    })
  }

  const onIncoming = () => {
    peer.current.off('connection')
    peer.current.on('connection', (conn) => {
     
      conn.on('open', () => {
        if (audioStream && conn.metadata.dimension === dimension) {
          onAudio(conn.peer)
        }
        console.log('connected with', conn.peer)
        conn.send({ type: 'new', alias: alias, dimension: dimension, id: peer.current.id, dimension: dimension })
        !online.find(o => o.id === conn.peer) && setOnline(online => [{alias: conn.metadata.alias, id: conn.peer, dimension: conn.metadata.dimension, conn: conn}, ...online])
        onData(conn)
        conn.on('error', (e) => {
          console.log('error: ', e)
        })
        conn.on('close', () => {
          onClose(conn)
        })
        conn.peerConnection.oniceconnectionstatechange = () => {
          if(conn.peerConnection.iceConnectionState == 'disconnected') {
           onClose(conn)
         }
        }
      }) 
    })
  }

const onData = (conn) => {
  conn.on('data', async (data) => {
    if (data.objktId && data.objktId > 0) {data.metadata = await fetchObjkt(data.objktId)}
    if (data.type === 'new') {setOnline(online => !online.find(o => o.id === data.id) ?
      [{alias:data.alias, id: conn.peer, dimension: data.dimension, conn:conn}, ...online]
      : online)
      if (audioStream) {
        if (data.dimension === dimension && !calls.find(c=> c.peer === conn.peer)){
          const call = peer.current.call(data.id, media.find(m=> m.alias===alias).stream,
            {metadata: {alias:alias, dimension: dimension, invites:invitations}})  
          call.peerConnection.oniceconnectionstatechange = () => {
            if(call.peerConnection.iceConnectionState == 'disconnected') {
                setCalls(calls => calls.filter(c => c.peer !== call.peer))
              } 
            }
        setCalls(calls => [...calls, call])   
         }
        else {
          calls.length > 0 && calls.find(c => c.peer === conn.peer).close()
          setInvitations(invitations => invitations.filter(i => i !== data.alias))
          setMedia(media => media.filter(m => m.alias !== data.alias))
          setCalls(calls => calls.filter(c => c.peer !== conn.peer))
        }
      }   
    } 
      if (data.type === 'dimension') {
        setOnline(online => online.map(o=> o.id === data.id ?
          {...o, dimension: data.dimension} : o))
        if (audioStream) {
          if (data.dimension === dimension && !calls.find(c=> c.peer === conn.peer)){
            const call = peer.current.call(data.id, media.find(m=> m.alias===alias).stream, {metadata: {alias:alias, dimension: dimension, invites:invitations}})  
            call.peerConnection.oniceconnectionstatechange = () => {
              if(call.peerConnection.iceConnectionState == 'disconnected') {
                  setCalls(calls => calls.filter(c=> c.peer !== call.peer))
                } 
              }
          setCalls(calls => [...calls, call])   
           }
          else {
            calls.length > 0 && calls.find(c => c.peer === conn.peer).close()
            setInvitations(invitations => invitations.filter(i => i !== data.alias))
            setMedia(media => media.filter(m => m.alias !== data.alias))
            setCalls(calls => calls.filter(c => c.peer !== conn.peer))
          }
        }   
      }
    else {
      if (data.type === 'invite') {
        setInvitations(invitations => !invitations.find(i => i === data.invite) ?
          [...invitations, data.invite]
          : invitations.filter(j => j !== data.invite))
        if (alias === data.invite && audioStream) {setAudioStream(false)}
        onCall()  
      }
    data.message && setConversation((messages) => [...messages, data])
    if (data.alias !== acc.address && data.alias !== alias) {
      const favicon = document.getElementById("favicon")
      favicon.href = '/message.ico'
      }
    }
  })
}

const onSubmit = e => {
  e.preventDefault()
  sendMessage(message)
  setMessage('')
  e.target.reset()
}

const onKeyPress = e => {
  if (e.key == 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage(e.target.value)
    setMessage('')
    e.target.value=''
  }
}

  useEffect(() => {
    const sendObjkt = () => {
      if (objkt > 1) {
        sendMessage(' ')
        setObjkt(0)
     }
    }
    sendObjkt()
  }, [objkt])

  
  useEffect(() => {
    const updateConn =  () => {
    setDimension(channel || 'live')
    if (meshed && peer.current) {
      onCall()
      onIncoming()
      online.filter((o) => (o.dimension === dimension || o.dimension === 'live') && o.alias !== alias).map((s) =>  {
            s.conn.off('data')
            onData(s.conn)
         })
        }
     }
  updateConn()
  }, [meshed,online,dimension,audioStream, media, calls]);

useEffect(() => {
    if (audioStream) {
      onCall()
      onIncoming()
      navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false
          })
        .then(stream => {
          onStream({s: stream,a: alias})
          let peers = [...new Map(online.filter((o) => (o.dimension === dimension) && o.alias !== alias).map((m) => [m.id, m])).values()].map(a =>a.id)
          peers.map((p) => {
              const call = peer.current.call(p, stream, {metadata: {alias:alias, invites:invitations,dimension:dimension}}); 
              call.peerConnection.oniceconnectionstatechange = () => {
                if(call.peerConnection.iceConnectionState === 'disconnected') {
                  setCalls(c => c.filter(i => i !== call))
                  } 
                } 
              setCalls(calls => [...calls, call])          
            })      
          })
        }   
    else if (!audioStream && media.length > 0 ) {
      (dimension === alias) && invitations?.forEach(i=>  onInvite('/invite '+i)) 
      calls?.map((c) => {
        if (dimension === alias) {
          c.close()
          media.forEach(m => m.stream.getTracks()[0].stop())       
        }
        else if (c.metadata.alias === alias) {
          c.close()
          media.forEach(m => (m.alias === alias) && m.stream.getTracks()[0].stop())       
        }
     })
      setMedia(media => dimension === alias ? [] : media.filter(m => m.alias !== alias))
      setCalls(calls => dimension === alias ? [] : calls.filter(c => c.metadata.alias  !== alias))
    onIncoming() 
  }
}, [audioStream]);

useEffect(() => {
  if (peer.current) {
    onCall()
    onIncoming()
  }
}, [invitations])

useEffect(() => {
  if (dimension === 'live') {
    media?.forEach(m => m.stream.getTracks()[0].stop())
    setMedia([])
  }
}, [dimension])

useEffect(() => {
  return () => {
    setDimension('hicetnunc')  
    peer.current?.off('call')
  }
}, [])

useEffect(() => {
  if (scrollTarget.current) {
    scrollTarget.current.scrollIntoView({ behavior: "smooth" });
  }
}, [conversation.length]);

const sendMessage = async (message) => { 
  if (!message) return
  switch (true) {
    case message.slice(0,6).toUpperCase() === '/objkt'.toUpperCase():
      setCollapsed(false)
      break
    case message.slice(0,7).toUpperCase() === '/random'.toUpperCase():
      let collection = await getCollection(acc.address); 
      setObjkt(collection[Math.floor(Math.random() * collection.length)].token.id)
      break
      
    case message.slice(0,6).toUpperCase() === '/tezos'.toUpperCase():
      try {
        const response = await fetch('https://api.teztools.io/v1/xtz-price');
        if (response) {
          const data = await response.json();
          sendMessage(`1ꜩ = $${parseFloat(data.price.toFixed(2))}`) 
        }
        else {
            console.log( "price not available" ) 
        }
        } catch (error) {
          console.error(error);
        }   
      break  
    
    case message.slice(0,8).toUpperCase() === '/imagine'.toUpperCase():
      let words = (await getCollection(acc.address)).map((a) => a.token.description
        .split(' ')[Math.floor(Math.random() * (a.token.description.split(' ').length - 1))])
      let shuffled = [...words].sort(() => 0.5 - Math.random())
      let filtered = shuffled.filter(e => !((/\d/.test(e)) || e.length<3 || e.length>15
       || e.includes('@') || e.includes('#')))
      sendMessage(filtered.slice(0, (1 + Math.floor(Math.random() * 11))).join(' ').toLowerCase())
      break

    case message.slice(0,5).toUpperCase() === '/help'.toUpperCase():
      const help = `p2p decentralized system\n---------------------------------------\n/objkt - select to show \n/random - show random collected\n/imagine - random words from collected\n/trash - show random #teztrash\n/tezos - current $ price of ꜩ\n${(dimension===alias) ? '/audio - stream audio\n/invite alias - invite to audiostream\n' : ''}${invitations.includes(alias) ? '/audio - stream audio\n' :''}${dimension==='live' && alias.length !==36 ? `/live - start session\n` : ''}---------------------------------------`
      setConversation((messages) => [...messages, {alias: '', message: help}])
      break  
    
    case message.slice(0,5).toUpperCase() === '/live'.toUpperCase():
      (alias.length !== 36) && history.push(`${alias}/live`)
      break
    
    case message.slice(0,5).toUpperCase() === '/audio'.toUpperCase():
        (dimension===alias || invitations.includes(alias)) && setAudioStream(!audioStream)
      break 
    case message.toUpperCase().includes('/INVITE'): 
      (dimension===alias) && audioStream && onInvite()
      break   

    case message.slice(0,6).toUpperCase() === '/trash'.toUpperCase()
      ||  message.slice(0,9).toUpperCase() === '/teztrash'.toUpperCase():
      const trash = await fetchTag(( 'teztrash'), 9999999)
      setObjkt(trash[Math.floor(Math.random() * trash.length)].id)
      break     
      
    case message.charAt(0) !== '/': 
      let metadata = ''
      if (objkt > 0 ) {metadata = await fetchObjkt(objkt)}
      setConversation((messages) => [...messages, {alias: alias, message: message.toString(),  metadata: metadata}])
      online.filter(o => o.dimension === dimension).map((s) => s.conn && s.conn.send(
        {
          alias: alias,
          message: message,
          objktId: objkt,
          dimension: dimension
        })
      )
      break
    }
  }
  
if((!acc || !meshed) && (dimension !== alias)) return(
  <Page title="be live">
    <div>
      {` : `} 
      {!acc && <Button onClick={async () => {await syncTaquito(); setMeshed(true)}}><Primary>sync/mesh</Primary></Button>}
      {acc && !meshed && <Button onClick={()=> {setMeshed(true); setItem('syncmesh', true)}}>
          <Primary>
            {meshed ? 'unmesh ' : ' mesh '}
          </Primary>
        </Button>} 
      {` to join. . .`}
    </div>
   <Footer />
  </Page>
)

if ((!online.find(o => (o.alias === dimension && o.dimension === dimension)) && dimension !== 'live')) {
  conversation.length > 0 && setConversation([])
  audioStream && setAudioStream(false)   
  invitations.length > 0 && setInvitations([])
 return(
  <Page title="be live" >
    <div>: <Button to={dimension}>{dimension}</Button> is offline</div>
  </Page>
)}

// if (peer.current?.disconnected) return (
// <Page title="chat" >
//   <div style={{margin:'18px'}}> disconnected. . .</div>
// </Page>
// )

return (
  <>
    {!collapsed ? <Select address={acc.address} setObjkt={setObjkt} setCollapsed={setCollapsed}/> :
      <div style={{ padding: '63px 0 0 0', overflowX: 'hidden'}}>
        <div className={styles.online}>
          {online.length>=1 && [...new Map(online.filter((o) => dimension !== 'live' ? o.dimension === dimension : o ).map((m) => [m.alias, m])).values()].map((o,i) => (
            <div style={{paddingLeft: '9px', marginBottom:'9px'}} key={i}> 
                {online.find(l => o.alias === l.dimension) || media.find(m => m.alias === o.alias) ? 
                  <span>{`* `}</span>
                : calls.find(c => (c.metadata.alias === o.alias)) || o.dimension ==='live' ? 
                  <svg stroke="currentColor" fill="var(--text-color)" strokeWidth="0" viewBox="0 0 24 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 5c-3.859 0-7 3.141-7 7s3.141 7 7 7 7-3.141 7-7-3.141-7-7-7zm0 12c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"></path><path d="M12 9c-1.627 0-3 1.373-3 3s1.373 3 3 3 3-1.373 3-3-1.373-3-3-3z"></path></svg> 
                : <svg stroke="currentColor" fill="var(--text-color)" strokeWidth="0" viewBox="0 0 24 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5 12c0 3.859 3.14 7 7 7 3.859 0 7-3.141 7-7s-3.141-7-7-7c-3.86 0-7 3.141-7 7zm12 0c0 2.757-2.243 5-5 5s-5-2.243-5-5 2.243-5 5-5 5 2.243 5 5z"></path></svg>
                }
                {audioStream && (dimension === alias && o.alias !== alias) ?
                  <Button onClick={() => { 
                    (dimension === alias && alias !== o.alias) ? 
                      onInvite('/invite '+o.alias)
                      : history.push(`${alias}/live`)
                  }}> 
                  <span
                    className={styles.top}
                    data-position={'top'}
                    data-tooltip={alias !== o.alias &&
                      !invitations.includes(o.alias) ? 'invite'
                      : 'uninvite'
                      }>
                    {o?.alias?.length == 36 ? walletPreview(o.alias) : o.alias}
                  </span>
                  </Button>
                  : 
                  dimension === 'live' && (alias.length !==36 && o.alias === alias || online.find(l => o.alias === l.dimension)) ?
                  <Button onClick={() => {history.push(`${o.alias}/live`)
                  }}> 
                  <span
                    className={styles.top}
                    data-position={'top'}
                    data-tooltip={o.alias === alias ? `start session` : `in session`}>
                    {o.alias}
                  </span>
                  </Button>
                  :
                  o.alias !== o.dimension ?
                    <Button 
                      href={o?.alias?.length == 36 ? `/tz/${o.alias}` :`/${o.alias}` }>
                      {o?.alias?.length == 36 ? walletPreview(o.alias) : o.alias}
                    </Button>
                  :  
                  o.alias !== alias ?
                   <Button 
                    href={o.alias}>
                    {o.alias}
                    </Button>
                  : <Button href={`/${o.alias}`} >{o.alias}</Button> 
                }   
              </div> 
            )) 
          }
        </div>
        {((dimension && dimension===alias) || invitations.includes(alias)) && 
          <div className={`${styles.icons} ${styles.stream}`}>
             <Button onClick={() => setAudioStream(audioStream => !audioStream)}>
             <span
                    className={styles.left}
                    data-position={'top'}
                    data-tooltip={!audioStream ? 'stream audio' : 'close stream'}
                  >
              {!audioStream ? <svg stroke="currentColor" fill="currentColor" strokeWidth="0" role="img" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><title></title><path d="M.331 11.378s.5418-.089.765.1439c.2234.2332.077.7156-.2195.7237-.2965.01-.5705.063-.765-.1439-.1946-.2066-.1424-.6218.2195-.7237m5.881 3.2925c-.0522.01-.1075-.018-.164-.059-.3884-.5413-.5287-2.3923-.707-2.5025-.185-.1144-.8545 1.0255-2.1862.903-.5569-.051-1.1236-.4121-1.4573-.662.031-.4206.0364-1.4027.8659-1.0833.5038.1939 1.3667.7266 2.1245-.23.8378-1.0579 1.2999-.7506 1.577-.5206.2771.23.0925 1.4259.5058 1.0916.4133-.3343 2.082-2.4103 2.082-2.4103s1.292-1.303 1.4898.067c.1979 1.3698 1.0403 2.8877 1.2635 2.8445.2234-.043 2.8223-5.3253 3.1945-5.666.3722-.3409 1.6252-.2961 1.5657.5781-.0596.8742-.1871 6.308-.1871 6.308s-.147 1.5311.0924.7128c.0992-.3392.206-.6453.3392-1.0024.6414-2.0534 1.734-5.5613 2.2784-7.3688.1252-.4325.233-.8037.3166-1.0891l.0001-.0008a3.5925 3.5925 0 0 1 .0973-.3305c.0455-.1532.0763-.2546.0858-.2813.0243-.068.0925-.1192.1884-.157.0962-.061.1995-.064.3165-.067.3021-.027.6907.012 1.0401.1119.1018 0 .2125.037.3172.1118v.0001s.0063 0 .0151.01c.0023 0 .0048 0 .0073.01.0219.015.0573.045.0983.095.0012 0 .0025 0 .004.01.017.021.0341.045.0515.073.1952.2863.315.814.1948 1.7498-.2996 2.3354-.5316 7.1397-.5316 7.1397s-.0461.2298.4353-.782c.0167-.035.0383-.066.058-.098.026-.017.0552-.042.0913-.085.2974-.3546 1.0968-.5629 1.6512-.5586.2336.028.4293.087.5462.1609.2188.333.0897 1.562.0897 1.562-.4612.043-1.3403.2908-1.6519.3366-.3118.046-.7852 2.0699-1.4433 1.8629-.6581-.2069-2.1246-1.1268-2.1246-1.2533 0-.1102.1152-1.4546.1453-1.8016.0022-.024.004-.046.0058-.068a.152.152 0 0 1 .0014-.014l-.0002.0003c.0213-.2733.0023-.3927-.1239-.1199-.1086.2346-.581 1.7359-1.1078 3.3709-.0556.1429-1.0511 3.1558-1.1818 3.5231-.156.4261-.287.7523-.3776.921-.1378.1867-.3234.3036-.5826.2252-.6465-.1954-1.4654-1.0889-1.473-1.3106-.0155-1.2503.0608-7.973-.2423-7.4127-.311.5744-2.73 4.5608-2.73 4.5608-.0405.01-.0705.01-.1062.01-.1712-.019-.4366-.074-.51-.2384-.004-.01-.0094-.018-.0129-.028-.0035-.01-.0075-.022-.0135-.04-.0329-.1097-.0463-.2289-.0753-.3265-.1082-.3652-.2813-.8886-.463-1.421-.2784-.9079-.5654-1.8366-.6127-1.9391-.0923-.2007-.2268-.116-.3475-.0002-.54.458-1.6868 2.4793-2.7225 2.5898"></path></svg>
              :  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256s-18.7 93.3-52.7 127.3S304.1 436 256 436c-48.1 0-93.3-18.7-127.3-52.7S76 304.1 76 256s18.7-93.3 52.7-127.3S207.9 76 256 76m0-28C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z"></path><path d="M363.5 148.5C334.8 119.8 296.6 104 256 104c-40.6 0-78.8 15.8-107.5 44.5C119.8 177.2 104 215.4 104 256s15.8 78.8 44.5 107.5C177.2 392.2 215.4 408 256 408c40.6 0 78.8-15.8 107.5-44.5C392.2 334.8 408 296.6 408 256s-15.8-78.8-44.5-107.5z"></path></svg>
              }
              </span>
             </Button> 
          </div>}
        {media?.map((m,i) => (<Audio key={i} media={m} dimension={dimension} alias={alias}/>))}
        <div className={styles.live}>
          {conversation.map((m,i) => (   
          <div style={{paddingLeft: `${m.alias?.length == 36 ? 
              walletPreview(m.alias).length+2 : m.alias?.length+2 }ch`, 
              textIndent:  `-${m.alias?.length == 36 ? 
              walletPreview(m.alias).length+2 : m.alias?.length+2 }ch`,
              marginBottom:'9px'}} ref={scrollTarget} key={i}>
                  <Link target="_blank" rel="noopener noreferrer" 
                      to={m.alias.length == 36 ? `/tz/${m.alias}` : `/${m.alias}` }>
                      {m.alias.length == 36 ? walletPreview(m.alias) : m.alias}
                  </Link>
              {`: `} 
              {m.message && RegExp(pattern, "i").test(m.message) ? 
                    <a href={m.message.slice(0, 4) !== 'http' ? 'https://'+ m.message : m.message}
                      className={styles.message}
                      target="_blank" rel="noopener noreferrer" >
                        {m.message}
                    </a> :    
                        m.metadata ? 
                        <div style={{marginLeft: m.metadata.mime.includes('video') ? 
                          `${m.alias?.length == 36 ? walletPreview(m.alias).length+2
                            : m.alias?.length+2 }ch` : '0'}} className={styles.objkt}
                          >
                          <div className={styles.cardContainer} >
                              <Button
                                  style={{position: 'relative'}}
                                  key={m.metadata.id}
                                  href={`${PATH.OBJKT}/${m.metadata.id}`}
                                  target="_blank" rel="noopener noreferrer"
                                >
                                  <div className={styles.container}>
                                    {renderMediaType({
                                      mimeType: m.metadata.mime,
                                      artifactUri: m.metadata.artifact_uri,
                                      displayUri: m.metadata.display_uri,
                                      displayView: true
                                    })}
                                  </div>
                              </Button>
                          <div style={{marginLeft: m.metadata.mime.includes('video') ? 
                            `-${m.alias?.length == 36 ? walletPreview(m.alias).length+2
                            : m.alias?.length+2 }ch` : '0'}} className={`${styles.card} ${styles.collection}
                            ${m.metadata.mime=='audio/mpeg' && styles.audio}`}
                            >
                              <Button
                              href={`${PATH.OBJKT}/${m.metadata.id}`}
                              >
                                <div className={styles.cardText}>   
                                  <div>OBJKT#{m.metadata.id}</div>
                                  <div>{m.metadata.title}</div>
                                </div>
                              </Button>

                          <div className={styles.cardText}>   
                            <Link
                              className={styles.text}
                              target="_blank" rel="noopener noreferrer"
                              to={`${PATH.ISSUER}/${m.metadata.creator.address}`}>
                              {m.metadata.creator.name || walletPreview(m.metadata.creator.address)}
                            </Link>
                          </div>
                            <div className={styles.cardCollect}>
                              <Button onClick={() => m.metadata.swaps[0]?.price && collect(m.metadata.swaps[0]?.id, m.metadata.swaps[0]?.price)}>
                                <Purchase>
                                  <div className={styles.cardCollectPrice}>
                                    {m.metadata.swaps[0]?.price ? 'collect for ' + m.metadata.swaps[0]?.price / 1000000 : 'not for sale'}
                                  </div>
                                </Purchase>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    : <span style={{wordWrap: 'break-word', whiteSpace:'pre-wrap' }}>{  m.message}</span> 
                    }
              </div>
            ))
          }
        </div>
        <div className={styles.footer}>
          <form onSubmit={onSubmit}> 
          <Textarea
              type='text'
              onChange={(e) => setMessage(e.target.value)}
              autoFocus
              placeholder='message - /help'
              onKeyPress={onKeyPress}
              max={270}
              label='message'
              value={message}
          />
          
           <Button type='submit' fit>
              <svg 
                  width="55px"
                  height="55px"
                  viewBox="0 0 44 44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                              fill: 'var(--text-color)',
                              stroke: 'var(--background-color)',
                            }}
                >
              <path d="M22 12L3 20l3.563-8L3 4l19 8zM6.5 12H22"  />
              </svg>
          </Button>
          </form>
        </div>
    </div>
  }  
  </>
  // </Page>
  )
}
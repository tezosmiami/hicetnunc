import React, { useContext, useEffect, useState, useRef } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { fetchGraphQL, getNameForAddress } from '../../data/hicdex'
import { getRestrictedAddresses, fetchCollection, query_collection} from '../../components/objkt-select'
import { renderMediaType } from '../../components/media-types'
import { Page } from '../../components/layout'
import { Button } from '../../components/button'
import { Textarea } from '../../components/input'
import { walletPreview } from '../../utils/string'
import { Purchase } from '../../components/button'
import { Link } from 'react-router-dom'
import { PATH } from '../../constants'
import { Peer } from "peerjs"
import styles from './styles.module.scss'
import Select  from '../../components/objkt-select'

const axios= require('axios')

const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

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
  async function fetchObjkt(id) {
    const { errors, data } = await fetchGraphQL(query_objkt, 'objkt', { id })
    if (errors) {
      console.error(errors)
    }
    const result = data.hic_et_nunc_token_by_pk
    return result
  }


export const Chat = () => {
    const [alias, setAlias] = useState();
    const [message, setMessage] = useState();
    const [objkt, setObjkt] = useState(0)
    const [conversation, setConversation] = useState([]);
    const [collapsed, setCollapsed] = useState(true)
    const [connections, setConnections] = useState([])
    const [peerIds, setPeerIds] = useState([])
    const [tabFocus, setTabFocus] = useState(true);
    const [online, setOnline] = useState([{alias:alias, id:''}])
    const { acc, collect } = useContext(HicetnuncContext)
    const scrollTarget = useRef(null);
    const peer = useRef();

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
    const handleFocus = () => {
      const favicon = document.getElementById("favicon")
      favicon.href = '/favicon.ico'
      setTabFocus(true);
    };

    const handleBlur = () => {
      setTabFocus(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);


   useEffect(() => {
    const updateAlias = async () => {
        acc && fetchGraphQL(getNameForAddress, 'GetNameForAddress', {
            address: acc.address,
          }).then(({ data, errors }) => {
            if (data) {
              const holder = data.hic_et_nunc_holder[0]?.name || acc.address
              setAlias(holder)
              setOnline([{ alias:holder, id:'' }])
              
            }
            if (errors) {
              console.error(errors)
          }
          })
        }
   updateAlias()
  }, [acc])

  useEffect(() => {
    const p2pSync = async () => {
    if (alias) {
      peer.current = new Peer(
        {
          host: 'https://hen-chat.herokuapp.com',
          secure: true,
          debug: 1,
          path: "/hicetnunc",
        })
        peer.current.on('open', (id) =>{
          console.log('id: ', id)
          setOnline([{alias: alias, id: id}])
        })
        
      let peers = await axios.get('https://hen-chat.herokuapp.com/hicetnunc/peerjs/peers').then(res => res.data)
          console.log(peers)
        //peer mesh
      for (let p in peers) {
        var conn = peer.current.connect(peers[p], {
          metadata: { 'alias': alias, 'address': acc.address }
        })

        conn.on('open',  () => {
          console.log('connected with ', conn.peer)
          setPeerIds([...peerIds, conn.peer])
          conn.on('data', async (data) => {
            console.log(data)
            console.log(online)
            if (data.objktId && data.objktId > 0) {data.metadata = await fetchObjkt(data.objktId)}
            if (data.alias) {online.some(i => i.alias === data.alias)
              ? setOnline(online.filter(i => i.alias !== data.alias))
              : setOnline(online => [{alias:data.alias, id: conn.peer}, ...online])}
          else {
            setConversation((messages) => [...messages, data])
            if (data.sender !== (walletPreview(acc.address) && alias)) {
              const favicon = document.getElementById("favicon")
              favicon.href = '/message.ico'
            }}
            console.log(data)     
          })
          conn.on('error', (e) => {
            console.log('error : ', e)
          })
          conn.on('close', () => {
            console.log(conn.peer)
            setPeerIds(ids => ids.filter(i => i !== conn.peer))
            setOnline(online => online.filter(i => i.id !== conn.peer))
            console.log('closed connection')
          })
          setConnections([...connections, conn])
          return () => {
            console.log("Cleaning up...");
            peer.current.disconnect();
          };
      })
      setPeerIds([...peerIds], [peer])
    }

    peer.current.on("connection", (conn) => {
        conn.on('open', () => {
          console.log('connected with ', conn.peer)
          conn.send({ alias: alias })
          !online.some(i => i.alias === conn.metadata.alias)
           && setOnline(online => [{alias: conn.metadata.alias, id: conn.peer}, ...online])
          setPeerIds([...peerIds, conn.peer])

          conn.on('data', async (data) => {
            console.log(data)
            if (data.objktId) data.metadata = await fetchObjkt(data.objktId)
            setConversation((messages) => [...messages, data])
            const favicon = document.getElementById("favicon")
            favicon.href = '/message.ico'
          })

          conn.on('error', (e) => {
            console.log('error: ', e)
          })
          conn.on('close', () => {
            setPeerIds(ids => ids.filter(i => i !== conn.peer))
            setOnline(online => online.filter(i => i.alias !== conn.metadata.alias))
            console.log('closed connection')
          })
          setConnections([...connections, conn])
        })
      })
    }
  }
    p2pSync()
  }, [alias]);


useEffect(() => {
  if (scrollTarget.current) {
    scrollTarget.current.scrollIntoView({ behavior: "smooth" });
  }
}, [conversation.length]);

const getCollection = async () => {
  let offset = 0
  let collection = await fetchCollection(acc.address, offset)
  while (collection.length % 500 === 0) {
    offset = offset+500
    collection = collection.concat(await fetchCollection(acc.address, offset))
  }
  let list = await getRestrictedAddresses()
  let result = collection.filter(e => !list.includes(e.token.creator.address))
  return result
}

const sendMessage = async (message) => {  
  if (!message) return
  switch (true) {
    case message.slice(0,6).toUpperCase() === '/objkt'.toUpperCase():
      setCollapsed(false)
      break
    case message.slice(0,7).toUpperCase() === '/random'.toUpperCase():
//       setObjkt(Math.floor(Math.random()
// * (await fetchCollection(acc.address)).length))
      let collection = await getCollection(); 
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
      let words = (await getCollection()).map(a => a.token.description
        .split(' ')[Math.floor(Math.random() * (a.token.description.split(' ').length - 1))])
      let shuffled = [...words].sort(() => 0.5 - Math.random())
      let filtered = shuffled.filter(e => !((/\d/.test(e)) || e.length<3 || e.length>15
       || e.includes('@') || e.includes('#')))
      sendMessage(filtered.slice(0, (1 + Math.floor(Math.random() * 11))).join(' ').toLowerCase())
      break
      
    case message.charAt(0) !== '/': 
      let metadata = ''
      if (objkt > 0 ) {metadata = await fetchObjkt(objkt)}
      setConversation((messages) => [...messages, {sender: alias, body: message,  metadata: metadata}])
      for (let c in connections) {
        connections[c].send(
        {
          sender: alias,
          body: message,
          objktId: objkt
        })
      break
    }
  }
}

const handleSubmit = e => {
  e.preventDefault()
  sendMessage(message)
  setMessage('')
  e.target.reset()
}

const handleKeyPress = e => {
  if (e.key == 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage(e.target.value)
    setMessage('')
    e.target.value=''
  }
}

if(!acc) return(
  <Page title="chat" >
    <div>: sync to join. . .</div>
  </Page>
)

if (peer.current.disconnected) return (
<Page title="chat" >
  <div style={{margin:'18px'}}> disconnected. . .</div>
</Page>
)
return (
  <>
  {!collapsed ? <Select address={acc.address} setObjkt={setObjkt} setCollapsed={setCollapsed}/> :
    <div style={{ padding: '63px 0 0 0'}}>
     <div className={styles.online}>
     {online.length>=1 && online.map((o,i) => (
      <div style={{paddingLeft: '9px', marginBottom:'9px'}} key={i}>
            {'* '}
          <Link target="_blank" rel="noopener noreferrer" 
                to={o?.alias?.length == 36 ? `/tz/${o.alias}` : `/${o.alias}` }>
            {o?.alias?.length == 36 ? walletPreview(o.alias) : o.alias}
          </Link>
      </div> 
      )) 
     }
     </div>
     <div className={styles.chat}>
       {conversation.map((m,i) => ( 
      <div style={{paddingLeft: `${m.sender?.length == 36 ? 
          walletPreview(m.sender).length+2 : m.sender?.length+2 }ch`, 
          textIndent:  `-${m.sender?.length == 36 ? 
          walletPreview(m.sender).length+2 : m.sender?.length+2 }ch`,
          marginBottom:'9px'}} ref={scrollTarget} key={i}>
            <Link target="_blank" rel="noopener noreferrer" 
                  to={m.sender.length == 36 ? `/tz/${m.sender}` : `/${m.sender}` }>
                {m.sender.length == 36 ? walletPreview(m.sender) : m.sender}
            </Link>
          :
           { RegExp(pattern, "i").test(m.body) ?
                <a href={m.body.slice(0, 4) !== 'http' ? 'https://'+ m.body : m.body}
                  className={styles.message}
                  target="_blank" rel="noopener noreferrer" >
                    {'  ' + m.body}
                </a> :    
                     m.metadata ? 
                     <div style={{marginLeft: m.metadata.mime.includes('video') ? 
                      `${m.sender?.length == 36 ? walletPreview(m.sender).length+2
                        : m.sender?.length+2 }ch` : '0'}} className={styles.objkt}
                      >
                      <div className={styles.cardContainer} >
                          <Button
                              style={{position: 'relative'}}
                              key={m.id}
                              href={`${PATH.OBJKT}/${m.id}`}
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
                         `-${m.sender?.length == 36 ? walletPreview(m.sender).length+2
                         : m.sender?.length+2 }ch` : '0'}} className={`${styles.card} ${styles.collection}
                         ${m.metadata.mime=='audio/mpeg' && styles.audio}`}
                        >
                          <Button
                          href={`${PATH.OBJKT}/${m.id}`}
                          >
                            <div className={styles.cardText}>   
                              <div>OBJKT#{m.id}</div>
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
                : <span>{' '+m.body}</span> }
           </div>
        ))
      }
       </div>
        <div className={styles.footer}>
          <form onSubmit={handleSubmit}> 
          <Textarea
              type='text'
              onChange={(e) => setMessage(e.target.value)}
              autoFocus
              placeholder='message'
              onKeyPress={handleKeyPress}
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
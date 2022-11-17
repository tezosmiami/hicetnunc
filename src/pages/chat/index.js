import React, { useContext, useEffect, useState, useRef } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { fetchGraphQL, getNameForAddress } from '../../data/hicdex'
import { getRestrictedAddresses, fetchCollection, query_collection} from '../../components/objkt-select'
import { renderMediaType } from '../../components/media-types'
import { Page } from '../../components/layout'
import { Button } from '../../components/button'
import { Textarea } from '../../components/input'
import { walletPreview } from '../../utils/string'
import  Select  from '../../components/objkt-select'
import { Purchase } from '../../components/button'
import { Link } from 'react-router-dom'
import { PATH } from '../../constants'
import styles from './styles.module.scss'

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
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(null)
    const [online, setOnline] = useState([alias])
    const { acc, collect } = useContext(HicetnuncContext)
    const scrollTarget = useRef(null);
    const ws = useRef();
    const counter = useRef(0)

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
    const updateAlias = async () => {
        acc && fetchGraphQL(getNameForAddress, 'GetNameForAddress', {
            address: acc.address,
          }).then(({ data, errors }) => {
            if (data) {
              const holder = data.hic_et_nunc_holder[0]?.name || acc.address
              setAlias(holder)
              setOnline([holder])
              
            }
            if (errors) {
              console.error(errors)
          }
          })
        }
   updateAlias()
  }, [acc])

  useEffect(() => {
    if (alias) {
    ws.current = new WebSocket('wss://hen-chat.herokuapp.com');
    ws.current.onopen = () => {
      console.log("Connection opened");
      setConnected(true);
      ws.current.send(
        JSON.stringify({
          alias: alias
        }),
      );
    };

    ws.current.onclose = () => {

      if (ws.current) {
        console.log('ws closed by server');
      } else {
        console.log('ws closed by dapp component unmount');
        return;
      }

      if (reconnecting) {
        return;
      };
      setConnected(false);
      console.log('ws closed');

      if (counter.current < 18) {
        counter.current++
        setReconnecting(true);
        setTimeout(() => setReconnecting(null), 5000);
      }
    };
    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.id) data.metadata = await fetchObjkt(data.id)
      Array.isArray(data.body) ? setOnline(data.body.reverse()) :
      setConversation((_messages) => [..._messages, data])
    };

    return () => {
      console.log("Cleaning up...");
      ws.current.close();
    };
  }
  }, [alias, reconnecting]);


useEffect(() => {
  if (scrollTarget.current) {
    scrollTarget.current.scrollIntoView({ behavior: "smooth" });
  }
}, [conversation.length]);

const sendMessage = async (message) => {  
  if (!message) return
  switch (true) {
    case message.toUpperCase() === '/objkt'.toUpperCase():
      setCollapsed(false)
      break
    case message.toUpperCase() === '/random'.toUpperCase():
//       setObjkt(Math.floor(Math.random()
// * (await fetchCollection(acc.address)).length))
      let collection = await fetchCollection(acc.address)
      let list = await getRestrictedAddresses()
      let result = collection.filter(e => !list.includes(e.token.creator.address))
      setObjkt(result[Math.floor(Math.random() * collection.length)].token.id)
      break
    case message.toUpperCase() === '/tezos'.toUpperCase():
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
    case message.charAt(0) !== '/': 
      ws.current.send(
        JSON.stringify({
          sender: alias,
          body: message,
          id: objkt
        })
      )
       break
    }
  counter.current > 0 && (counter.current = 1)
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
if (counter == 18) return (
<Page title="chat" >
  <div> disconnected. . .</div>
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
                to={o?.length == 36 ? `/tz/${o}` : `/${o}` }>
            {o?.length == 36 ? walletPreview(o) : o}
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
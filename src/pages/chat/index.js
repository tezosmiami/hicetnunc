import React, { useContext, useEffect, useState, useRef } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { fetchGraphQL, getNameForAddress } from '../../data/hicdex'
import { Button } from '../../components/button'
import { Textarea } from '../../components/input'
import { walletPreview } from '../../utils/string'
import { Page } from '../../components/layout'
import { Link } from 'react-router-dom'
import styles from './styles.module.scss'



export const Chat = () => {
    const [alias, setAlias] = useState();
    const [message, setMessage] = useState();
    const [conversation, setConversation] = useState([]);
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(null)
    const [counter, setCounter] = useState(0)
    const [online, setOnline] = useState([])
    const { acc } = useContext(HicetnuncContext)
    const scrollTarget = useRef(null);
    const ws = useRef();

   useEffect(() => {
    const updateAlias = async () => {
        acc && fetchGraphQL(getNameForAddress, 'GetNameForAddress', {
            address: acc.address,
          }).then(({ data, errors }) => {
            if (data) {
              const holder = data.hic_et_nunc_holder[0]
              setAlias(holder?.name || acc.address)
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
          alias: alias,
          counter: counter
        }),
      );
    };

    ws.current.onclose = () => {

      if (ws.current) {
        console.log('ws closed by server');
      } else {
        console.log('ws closed by app component unmount');
        return;
      }

      if (reconnecting) {
        return;
      };
      setConnected(false);
      console.log('ws closed');

      if (counter < 18) {
        setCounter(counter+1)
        setReconnecting(true);
        setTimeout(() => setReconnecting(null), 5000);
      }
    };
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      Array.isArray(data.body) ? setOnline(data.body.reverse()) :
      setConversation((_messages) => [..._messages, data]);
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

const sendMessage = (message) => {  
  if (message) {
    ws.current.send(
      JSON.stringify({
        sender: alias,
        body: message,
      })
    );
   counter > 0 && setCounter(1);
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
if (counter == 18) return (
<Page title="chat" >
  <div>disconnected. . .</div>
</Page>
)

return (
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
          : <span style={{wordWrap: 'break-word', whiteSpace:'pre-line' }}>{m.body}</span>
      </div> 

  ))
       }
       </div>
        <div className={styles.container}>
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
  )
}
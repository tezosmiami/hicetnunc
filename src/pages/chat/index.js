import React, { useContext, useEffect, useState, useRef } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { fetchGraphQL, getNameForAddress } from '../../data/hicdex'
import { Textarea } from '../../components/input'
import { Page, Container, Padding } from '../../components/layout'
import { walletPreview } from '../../utils/string'
import styles from './styles.module.scss'
import { MessageBasedClient } from '@airgap/beacon-sdk'

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
              setAlias(holder?.name || walletPreview(acc.address))
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
      // console.log(counter)
    ws.current = new WebSocket("wss://hen-chat.herokuapp.com");
    ws.current.onopen = () => {
      console.log("Connection opened");
      setConnected(true);
      counter == 0 && ws.current.send(
        JSON.stringify({
          alias: alias
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
        setCounter(counter+=1)
        setReconnecting(true);
        setTimeout(() => setReconnecting(null), 5000);
      }
    };
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      Array.isArray(data.body) ? setOnline(online.concat(data.body)) :
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
  }
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
    <div>please sync wallet for chat. . .</div>
  </Page>
)
if (counter == 18) return (
<Page title="chat" >
  <div>disconnected. . .'</div>
</Page>
)

return (
    <div style={{overflow: 'hidden', padding: '63px 0 0 0'}}>
     <div className={styles.online}>
     {online.length>=1 && online.map((o,i) => (
      <div style={{marginBottom:'9px'}} ref={scrollTarget} key={i}>
        {o}
      </div> 
      )) 
     }
     </div>
     <div className={styles.chat}>
       {conversation.map((m,i) => (
      <div style={{marginBottom:'9px'}} ref={scrollTarget} key={i}>
        {m.sender}: {m.body}
      </div> 
    
  ))
       }
       </div>
        <div className={styles.container}>
          <Textarea
              type='text'
              onChange={(e) => setMessage(e.target.value)}
              autoFocus
              placeholder='message'
              onKeyPress={handleKeyPress}
              className={styles.container1} 
              max={270}
              label='message'
              value={message}
          />
        </div>
    </div>
  )
}
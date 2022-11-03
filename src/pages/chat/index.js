import React, { useContext, useEffect, useState, useRef } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { fetchGraphQL, getNameForAddress } from '../../data/hicdex'
import { Input, Textarea } from '../../components/input'
import { Page, Container, Padding } from '../../components/layout'
import { walletPreview } from '../../utils/string'
import styles from './styles.module.scss'
import { MessageBasedClient } from '@airgap/beacon-sdk'

export const Chat = () => {
    const [alias, setAlias] = useState();
    const [message, setMessage] = useState();
    const [conversation, setConversation] = useState([]);
    const [isConnectionOpen, setConnectionOpen] = useState(false);
    const { acc } = useContext(HicetnuncContext)
    const scrollTarget = useRef(null);
    const ws = useRef();

   useEffect(() => {
    const updateAlias = async () =>{
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
    ws.current = new WebSocket("ws://hen-chat.herokuapp.com");

    ws.current.onopen = () => {
      console.log("Connection opened");
      setConnectionOpen(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setConversation((_messages) => [..._messages, data]);
    };

    return () => {
      console.log("Cleaning up...");
      ws.current.close();
    };
  }, []);

  useEffect(() => {
    if (scrollTarget.current) {
      scrollTarget.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation.length]);

  const sendMessage = (event) => {
    event.preventDefault();
    if (message) {
      ws.current.send(
        JSON.stringify({
          sender: alias,
          body: message,
        })
      );
      setMessage('');
    }
  //  setMessages(arr => [...arr, message]);
  //  setMessage('')
  //  event.target.reset();
  //  event.target.value=''
  }

if(!acc) return('please sync wallet for chat')

return (
    <Page title="mint" >
       {conversation.map((m,i) => (
    <div className={styles.chat} key={i}>
      {m.sender}: {m.body}
    </div>
  ))
       }
         <div className={styles.container}
         style={{borderTop:'1px solid black'}}>
            <Padding>
            <form onSubmit={sendMessage}>
            <label>
            <Input
                type="text"
                onChange={(e) => setMessage(e.target.value)}
                autoFocus
                placeholder="send message"
                max={270}
                value={message}
              />
              </label>
              {/* <Input type="submit" /> */}
              </form>
              </Padding>
        </div>
    </Page>
    )

}
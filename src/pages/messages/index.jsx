import React, { useContext, useEffect, useState, useRef } from 'react'
import { Button, Purchase, Primary } from '../../components/button'
import { useHistory, Link } from "react-router-dom"
import { Textarea } from '../../components/input'
import { useNostrContext } from '../../context/NostrContext'
import { Loading } from '../../components/loading'
import styles from './styles.module.scss'

export const Messages = () => {
    const [message, setMessage] = useState(null)
    const [thread, setThread] = useState(window.location.pathname.split('/')[2])
    const { nostrAcc, messages, loading, counter, quantity, sendMessage, decryptMsg, setMessages  } = useNostrContext()
    const history = useHistory();
    const scrollTarget = useRef(null)

    const onSubmit = e => {
        e.preventDefault()
        sendMessage(thread, message)
        setMessage('')
        e.target.reset()
    }

    const onKeyPress = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          try {
          sendMessage(thread, e.target.value)
          setMessage('')
          e.target.value=''
          }catch (e) { console.log(e) }
        }
      }

    useEffect(() => {
        if (scrollTarget.current) {
          scrollTarget.current.scrollIntoView(false, {behavior: 'smooth'});
        }
      }, [messages]);

      useEffect(() => {
        const decryptMsgs = async() => {

            const v = messages.get(thread)
            const msgs = v?.messages.sort((a, b) => a.when - b.when).map(async (m) => {
                if (!m.decoded) {
                    const decoded = await decryptMsg(m.what, thread)
                    m.what = decoded
                    m.decoded = true
                }
            return m
         })
            msgs && Promise.all(msgs).then(r => setMessages(m => new Map(m.set(thread, {...v, messages: r}))))
        }

        !loading && thread && nostrAcc && decryptMsgs()
      }, [thread, nostrAcc, loading, counter])
      
    useEffect(() => {
        const decodeMsgs = async () =>{
        Array.from(messages, async ([k, v ]) => {
                const msgs =  v.messages.sort((a, b) => a.when - b.when)
                if (!msgs[msgs.length-1].decoded) {
                    const decoded = await  decryptMsg(msgs[msgs.length-1].what, k)
                    msgs[msgs.length-1].what = decoded
                    msgs[msgs.length-1].decoded = true
                }
                setMessages(m => new Map(
                    [...m.set(k, {...v, messages: msgs})]
                    .sort((a, b) => b[1].messages[b[1].messages.length-1].when - a[1].messages[a[1].messages.length-1].when)))
                    return msgs 
            })
        }
    !loading && nostrAcc && decodeMsgs()
    }, [loading, nostrAcc, counter])

    if(!nostrAcc) return(
        <div style={{width: '95%', top: '108px', position: 'relative', zIndex: '111', overflowY: 'visible'}}>
        <Link to='/config'>link Nostr for encrypted decentralized dms</Link> 
    </div>)
   //back browser?
    else if( (loading || counter < quantity) && !thread) return(
        <div style={{width: '95%', top: '108px', position: 'relative', zIndex: '111', overflowY: 'visible'}}>
            <div style={{paddingBottom: '64px'}}>:waiting for messages. . .</div>
            {/* <Loading/> */}
        </div>
        )
      
    else return (
        <>
            <div style={{height: thread ? 'calc(100vh - 198px)' : '', top: '98px', position: 'relative', zIndex: '111', overflowY: 'scroll'}}>
            <div style={{width: '98%'}}>
            {thread ?
                <div>
                    <div style={{position: 'fixed', top: '72px', marginLeft: '18px', height: '100px'}}>
                        <Button onClick={()=> {setThread(null); history.push('/messages')}}><Purchase>{`<-`}</Purchase></Button>
                    </div>
                    <table style={{ width: '92vw',marginLeft: '12px'}}>
                        <tbody>
                        {messages.get(thread)?.messages?.sort((a, b) => a.when - b.when).map((m,i) =>
                                    <tr key={i}
                                        ref={scrollTarget} 
                                        className={styles.message}
                                    >
                                        <td style={{verticalAlign: 'top', paddingTop: '21px'}}>
                                            {m.who}:&nbsp;
                                            
                                        </td>
                                        <td style={{ textAlign: 'right', paddingTop: '21px', paddingBottom: '18px', wordBreak: 'break-word'}}>
                                            {m.decoded && m.what}
                                        </td>
                                    </tr>
                                )}     
                        </tbody>
                    </table>                   
                </div>
                :
                <table style={{ width: '92vw',marginLeft: '12px'}}>
                    <tbody>
                    {messages && Array.from(messages, ([k, v ]) => 
                        <tr
                            key={k}
                            onClick={() => {setThread(k);history.push(`/messages/${k}`) }}
                            className={styles.message}
                        >
                            <td style={{verticalAlign: 'top', paddingTop: '21px'}}>
                            {v.alias}:&nbsp;
                            </td>
                            <td style={{ textAlign: 'right', paddingTop: '21px', paddingBottom: '18px', wordBreak: 'break-word'}}>
                            {v.messages[v.messages.length-1].decoded && v.messages[v.messages.length-1].what}
                            </td>
                        </tr>
                        )}
                    </tbody>
                </table>
                }
            </div>
            { thread && <div className={styles.footer}>
                <form onSubmit={onSubmit}> 
                <Textarea
                    type='text'
                    onChange={(e) => setMessage(e.target.value)}
                    autoFocus
                    placeholder='message'
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
                                    boxShadow: 'none',
                                    fill: 'var(--text-color)',
                                    stroke: 'var(--background-color)',
                                    }}
                        >
                        <path d="M22 12L3 20l3.563-8L3 4l19 8zM6.5 12H22"  />
                    </svg>
                </Button>
                </form>
            </div>}
        </div>  
        </>
        )
    }    
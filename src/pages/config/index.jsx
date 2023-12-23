/* eslint-disable */

import React, { Component } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { Container, Padding, Page } from '../../components/layout'
import { BottomBanner } from '../../components/bottom-banner'
import { Input, Textarea } from '../../components/input'
import { Button, Curate, Primary, Purchase } from '../../components/button'
import { Upload } from '../../components/upload'
import { Identicon } from '../../components/identicons'
import { fetchLightning } from '../../context/LightningContext'
import { NostrLink } from '../../components/nostr-link'
import {nip19, generatePrivateKey, getPublicKey} from 'nostr-tools'
import { getItem, setItem, removeItem } from '../../utils/storage'
import { utils } from 'lnurl-pay/'
import { Buffer } from 'buffer'
import { create } from 'ipfs-http-client'
import { char2Bytes } from '@taquito/utils'
import styles from './styles.module.scss'
import axios from 'axios'

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const auth =
    'Basic ' + Buffer.from(import.meta.env.VITE_INFURA_ID + ':' + import.meta.env.VITE_INFURA_KEY).toString('base64');

const infuraUrl = 'ipfs.infura.io:5001'

const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
      authorization: auth,
  },
});

const query_tz = `
query addressQuery($address: String!) {
  hic_et_nunc_holder(where: { address: {_eq: $address}}) {
    address
    name
    hdao_balance
    metadata
    metadata_file
  }
}
`

async function fetchTz(addr) {
  const { errors, data } = await fetchGraphQL(query_tz, 'addressQuery', {
    address: addr,
  })
  if (errors) {
    console.error(errors)
  }
  const result = data.hic_et_nunc_holder
  return result
}

async function fetchGraphQL(operationsDoc, operationName, variables) {
  let result = await fetch(import.meta.env.VITE_GRAPHQL_API, {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName,
    }),
  })
  return await result.json()
}

export class Config extends Component {
  static contextType = HicetnuncContext

  state = {
    loading: true,
    vote: 0,
    address: '',
    subjkt: '',
    description: '',
    social_media: '',
    identicon: '',
    subjktUri: '', // uploads image
    cid: undefined,
    selectedFile: undefined,
    lightning: null,
    npub: null,
    nsec: null,
    nostrSync: false,
    toogled: false,
  }
 // on load
  componentDidMount = async() => {
    // await this.context.syncTaquito()
    const { acc, proxyAddress } = this.context
    // Maybe use proxy address here
    const address = proxyAddress || acc?.address
    this.setState({ address })
    if (address) {
      let res = await fetchTz(address)
      this.context.subjktInfo = res[0]
      if (this.context.subjktInfo) {
        let cid = await axios.get('https://ipfs.io/ipfs/' + (this.context.subjktInfo.metadata_file).split('//')[1]).then(res => res.data)
        this.context.subjktInfo.gravatar = cid
        if (cid.description) this.setState({ description: cid.description })
        if (cid.identicon) this.setState({ identicon: cid.identicon })
        if (cid.lightning) this.setState({ lightning: cid.lightning })
        if (cid.nostr) this.setState({ nostr: cid.nostr })
        if (this.context.subjktInfo.name) this.setState({ subjkt: this.context.subjktInfo.name })
      }
    } 
    let nostr = getItem('nostr')?.keys
    //revisit
    if (nostr) {
      let npub = nostr?.pub
      let nsec = nostr?.priv
      npub && this.setState({ npub: nip19.npubEncode(npub) })
      nsec && this.setState({ nsec: nip19.nsecEncode(nsec)})
      npub && !nsec && this.setState({ nostrSync: true })
    }

    //revist
    this.setState({ lightning: await fetchLightning(address)})
  }

  componentDidUpdate =async (prevState)=>{
      if (this.state?.address !== this.context.acc?.address) {
        this.componentDidMount()
      }
   }

  handleChange = (e) => {
    if (e.target.name == 'subjkt' && !e.target.checkValidity()) {
      // console.log(e.target.pattern)
      e.target.value = e.target.value.replace(/[^a-z0-9-._]/g, "")
    }
    // console.log('set', e.target.name, 'to', e.target.value)
    this.setState({ [e.target.name]: e.target.value })
  }

  // config subjkt

  subjkt_config = async () => {
    if (this.state.nsec) { this.setNostr() }
    if (this.state.selectedFile) {
      const [file] = this.state.selectedFile
      const buffer = Buffer.from(await file.arrayBuffer())
      this.setState({ identicon: 'ipfs://' + (await ipfs.add(buffer)).path })
    }

    this.context.registry(
      this.state.subjkt,
      await ipfs.add(
        Buffer.from(JSON.stringify({
           description: this.state.description,
          identicon: this.state.identicon, 
          lightning: this.state.lightning, 
          nostr: this.state.npub }, null, 2))
      )
    )
  }

  // upload file

  onFileChange = async (event) => {
    this.setState({
      selectedFile: event.target.files,
      fileTitle: event.target.files[0].name,
    })

    const [file] = event.target.files

    const buffer = Buffer.from(await file.arrayBuffer())
    this.setState({ identicon: 'ipfs://' + (await ipfs.add(buffer)).path })

  }

  hDAO_operators = () => {
    this.context.hDAO_update_operators(this.context.acc.address)
  }

  unregister = () => this.context.unregister()

  hDAO_config = () => {
    // convert float to 10^6
    setItem('hDAO_config', this.state.vote)
  }

  lightning_config = async() => {
    if((this.state.lightning.length === 70 && utils.isLnurl(this.state.lightning))
       || utils.isLightningAddress(this.state.lightning)) {  
      try {
        let result = await this.context.register_lightning(char2Bytes(this.state.lightning))
        result && setTimeout(() => {this.props.history.push('/tz/'+this.context.address)}, 3000)  
      } catch (err) {console.log(err)}    
    }
  }

  toggle = () => this.setState({ toogled: !this.state.toogled })
  /*     

   signature studies
   
   const bytes =
         '05' +
         char2Bytes(
           JSON.stringify({
             alias: this.state.alias,
             description: this.state.description,
           })
         )
       console.log(bytes)
       const payload = {
         signingType: SigningType.MICHELINE,
         payload: bytes,
         sourceAddress: this.context.addr,
       }
       console.log(payload)
       this.context.sign(payload) 
       
  */

  checkNostr = () => {
    try {
      //check for hex

      let pk = this.state.nsec.startsWith('nsec') ? nip19.decode(this.state.nsec)
        : nip19.decode(nip19.nsecEncode(this.state.nsec))
      if (pk.type === 'nsec') return true
    } catch (e) { return false }
    }

  setNostr = () => {
        let priv = this.state.nsec.startsWith('nsec') ? nip19.decode(this.state.nsec)?.data
        : this.state.nsec
        
        let pub = getPublicKey(priv)
        let npub = nip19.npubEncode(pub)
        setItem(`nostr`,{...{keys:{ pub: pub, priv: priv}}})
        this.setState({ npub: npub })
        window.dispatchEvent(new Event('storage'));
        
    }    

  syncNostr = async () => {
    if (!this.state.nostrSync) {
      let nip07 = 'nostr' in window
      if (nip07) {
        const pub = await window.nostr.getPublicKey()
        if (pub) {
          setItem(`nostr`, {...{keys: { pub: pub }}})
          setItem(`nostrSync`, true)
          this.setState({ npub: nip19.npubEncode(pub), nostrSync: true })
          window.dispatchEvent(new Event('storage'));
        }   
      } else window.open('https://getalby.com')
    } else {
        removeItem('nostr')
        setItem('nostrSync', false)
        this.setState({ npub: null, nostrSync: false })
        window.dispatchEvent(new Event('storage'));
      }
  }
  genNostr = () => {
    let sk = generatePrivateKey() 
    let pk = getPublicKey(sk)
    setItem(`nostr`, {...{keys: { pub:pk, priv:sk }}})
    this.setState({ npub: nip19.npubEncode(pk), nsec: nip19.nsecEncode(sk) })
    window.dispatchEvent(new Event('storage'));
  }

  rmNostr = () => {
    removeItem(`nostr`)
    this.setState({ npub: null, nsec: null, warning: false, clipboard: false })
    window.dispatchEvent(new Event('storage'));
  }


  // warnNostr = () => {
  //   this.setState({ warning: true })
  // }
  // nostrSubmit = async (e) => {
  //   e.preventDefault()
  //   let action = e.nativeEvent.submitter.name
  //   this[`${action}Nostr`]()
  // }

  // sign = () => {
  //   this.context.signStr({
  //     /*       payload : "05" + char2Bytes(this.state.str) */
  //     payload: this.state.str
  //       .split('')
  //       .reduce(
  //         (hex, c) => (hex += c.charCodeAt(0).toString(16).padStart(2, '0')),
  //         ''
  //       ),
  //     /*         sourceAddress: this.context.addr,
  //      */
  //   })
  // }
 
  render() {
// sync unsync
// pattern
   return (
      this.context.acc && <Page>
        <Container>
          <Identicon address={this.state.address} logo={this.state.identicon} />
          <div style={{ height: '20px' }}></div>
          <input type="file" onChange={this.onFileChange} />
          <div style={{ height: '20px' }}></div>
          <Padding>
            <br/>
            <Input
              name="subjkt"
              onChange={this.handleChange}
              placeholder="Alias"
              label="Alias"
              value={this.context.subjktInfo ? this.context.subjktInfo.name : undefined}
              pattern="^[a-z0-9\-._]*$"
            />
            <Input
              name="description"
              onChange={this.handleChange}
              placeholder="Description"
              label="Description"
              value={this.state.description}
            />
          </Padding>
          <Button onClick={this.subjkt_config}>
                <Purchase>Save Profile</Purchase>
          </Button>
        </Container>
        <br/>
        {/* <p>&nbsp;</p> */}
        <Container>
          <Padding>
          {/* <form onSubmit={this.nostrSubmit}> */}
            {this.state.npub && <Input
              name="npub"
              onChange={this.handleChange}
              placeholder="nostr pub"
              label="Nostr Public Key"
              value={this.state.npub}
            />}
            {!this.state.nostrSync &&
              <Input
                name="nsec"
                type="password"
                onChange={this.handleChange}
                placeholder="Nostr Secret"
                label="Nostr Secret"
                value={this.state.nsec}
              />}
              <div className={styles.nostr}>
                {(!this.state.npub && this.checkNostr())
                    && <Button onClick={()=> this.setNostr()} >
                  <Purchase name='save'>Set Nostr</Purchase>
                </Button>}
                {!this.state.nsec && !isMobile &&  <Button onClick={() => this.syncNostr()} >
                  <Purchase>{!this.state.npub ? 'Sync Nostr (desktop)' : 'Unsync Nostr (desktop)'}</Purchase>
                </Button>}
                {!this.state.nsec && !this.state.nostrSync && <Button onClick={() => this.genNostr()}>
                    <Purchase>Generate Nostr Keys</Purchase>
                  </Button>}
                {this.state.nsec && this.state.npub && <Button onClick={() => this.setState({ warning: true })}>
                  <Purchase>Remove Nostr Keys </Purchase>
                </Button>}
                {this.state.npub && this.state.address && <NostrLink pubkey={nip19.decode(this.state.npub).data}/>}
                {this.state.warning && 
                    <>
                      <button onClick={() =>  {navigator.clipboard.writeText(this.state.nsec)
                      nsec17eyn278zfp0fytptvudrgyj9dwanquse38wmfkq44mn3g6rnydss4g7q3w
                        this.setState({ warning: true, clipboard: true })}}>
                        backup Nostr secret key! 
                      </button>
                      <span>{this.state.clipboard && 'copied to  clipboard!'}</span>
                      <div>
                        <span>remove keys from site?</span>
                        <button className={styles.warning} onClick={() => this.rmNostr()}>
                          yes
                        </button>
                        <button className={styles.warning} onClick={() => this.setState({ warning: false, clipboard: false })}>
                          cancel
                        </button>
                      </div>
                     </>}
              {/* </form> */}
            </div>
            {/* <p style={{ marginTop : '7.5px' }}>link Nostr keys for extra features</p> */}
          </Padding>
        </Container> 
        <br/>
        <Container>
          <Padding>
            <Input
              name="lightning"
              onChange={this.handleChange}
              placeholder="Lightning (URL or Address)"
              label="Lightning (URL or Address)"
              value={this.state.lightning}
            />
            <Button onClick={this.lightning_config}>
              <Purchase>Register <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height=".88em" width=".88em" xmlns="http://www.w3.org/2000/svg"><path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"></path></svg></Purchase>
            </Button>
            {/* <p style={{ marginTop : '7.5px' }}>link Lightning to activate zaps</p> */}
          </Padding>
        </Container>   
        <Container>
          <Padding>
            <div style={{ display: 'inline' }}>
              {/* <p style={{paddingTop : '7.5px' }}>
                <span>
                link lightning and nostr to receive zaps and direct messages
                </span>
              </p> */}
           
              <p>
                <span>
                  link Twitter, Discord, GitHub, and website with </span>
                <span>
                  <a href="https://tzprofiles.com" target="_blank" rel="noopener noreferrer">
                    <Button>
                      <span style={{ color: 'var(--text-color)', fontWeight: 'bold' }}> Tezos Profiles</span>
                    </Button>
                  </a>
                </span>
              </p>
            </div>
          </Padding>
        </Container>
        <Container>
          <Padding>
            <div onClick={this.toggle}>
              <Primary>
                + legacy
              </Primary>
            </div>
          </Padding>
        </Container>
        {
          this.state.toogled ?
            <Container>
              <Padding>
                <Input
                  name="vote"
                  onChange={this.handleChange}
                  placeholder="hDAO Curation"
                  label="hDAO Curation"
                  value={undefined}
                />

                <Button onClick={this.hDAO_config}>
                  <Purchase>Save ○</Purchase>
                </Button>
                <p style={{ marginTop : '7.5px' }}>hic et nunc DAO ○ curation parameter</p>
              </Padding>
            </Container>
            :
            undefined
        }

        {/*         <Container>
          <Padding>
            <Button onClick={this.unregister}>
              <Curate>Unregister</Curate>
            </Button>
          </Padding>
        </Container> */}
        {/*         <BottomBanner>
          The dApp has been temporarily disabled for a contract migration. Follow <a href="https://twitter.com/hicetnunc2000" target="_blank">@hicetnunc2000</a> or <a href="https://discord.gg/jKNy6PynPK" target="_blank">join the discord</a> for updates.
        </BottomBanner> */}
      </Page>
    )
  }
}

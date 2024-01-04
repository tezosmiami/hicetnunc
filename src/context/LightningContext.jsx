import { useState, useEffect, createContext, useContext} from "react";
import { HicetnuncContext } from './HicetnuncContext'
import { fetchGraphQL, getNameForAddress } from '../data/hicdex'
import { requestProvider } from "webln";
import { bytes2Char } from "@taquito/utils";
// import { bech32 } from 'bech32'
import { requestInvoice } from 'lnurl-pay'
// import { LightningAddress } from "alby-tools"
import { walletPreview } from '../utils/string'
import axios from 'axios'

const LightningContext = createContext();

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// const lnAddress_REGEX =  /^((?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@((?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
// const lnUrl_REGEX =   /^(?:http.*[&?]lightning=|lightning:)?(lnurl[0-9]{1,}[02-9ac-hj-np-z]+)/

// export const isLightning = (lnUrlorAddress)  => {
//   if (lnUrl_REGEX.test(lnUrlorAddress.toLowerCase()) || lnAddress_REGEX.test(lnUrlorAddress)) {
//     return true
//   }  else return false
// }

// export const lnUrlToAddress = (str) => {
//   try {
//     const decoded = bech32.decode(str, 18000);
//     const split = Buffer.from(bech32.fromWords(decoded.words)).toString().split('/')
//     return `${split[5]}@${split[2]}`
//   } catch (e) {
//     console.error(e);
//     return '';
//   }
// }

export const fetchLightning = async(address) => { 
  
  try{
    const result = await axios.get(`https://api.tzkt.io/v1/bigmaps/464343/keys/${address}`)
    return bytes2Char(result.data.value)
  } catch (err) {
    return null
  }
} 


export const useLightningContext = () => {
    const lightning = useContext(LightningContext);
    
    if (!lightning) {
      throw new Error(
        `!lightning`
      );
    }
    return lightning;
  };
  
const LightningContextProvider = ({ children }) => {
    const { acc } = useContext(HicetnuncContext)
    const [sender, setSender] = useState(null)
    const [subjktLightning, setSubjktLightning] = useState(null)
    const [subjktNostr, setSubjktNostr] = useState(null)

    useEffect(() => {
      //move to h=n context
      const getAlias = async () => {
          acc && fetchGraphQL(getNameForAddress, 'GetNameForAddress', {
              address: acc.address,
              }).then(async ({ data, errors }) => {
              if (data) {
                  const holder = data.holder[0]?.name 
                  || walletPreview(acc.address)
                  setSender(holder)
                  const metadata = data.holder[0]?.metadata_file 
                  if (metadata) {
                    let cid = await axios.get('https://dweb.link/ipfs/' 
                    + metadata.split('//')[1]).then(res => res.data)
                    if (cid.lightning) setSubjktLightning(cid.lightning)
                    if (cid.nostr) setSubjktNostr(cid.nostr)
                  }
                } 
              if (errors) {
                  console.error(errors)
              }
              })
          }
      getAlias()
      }, [acc])
      

    const has_lightning = () => {
      if (typeof window.webln !== 'undefined') {
        console.log('WebLN is available!')
        return true
      } else if (isMobile) {
          window.location = 'lightning://'; 
          setTimeout(function() {
          
        }, 500);
        return false
      }
    }


    const sync_lightning = async() => {
      let webln;
      try {
        webln = await requestProvider()
      } catch (err) {
        console.log('No Lightning Wallet')
        return null
      }
      // setLightning(webln.)
      return webln
    }

    const zap_lightning = async(lnUrlOrAddress, amount) => {
        try {
          const { invoice, params, successAction, validatePreimage } =
          await requestInvoice({
              lnUrlOrAddress: lnUrlOrAddress,
              tokens: amount, // satoshis
              comment: `magicCity zap from ${sender || 'unknown'}`
          }) 
          // { * alby-tools * }
          // let address
          // if (lnUrl_REGEX.test(lnUrlOrAddress)) { 
          //   let address = lnUrlToAddress(lnUrlOrAddress)
          // }
          // const ln = new LightningAddress(address || lnUrlOrAddress)
          // await ln.fetch()
          // const { paymentRequest: invoice } = await ln.requestInvoice({ satoshi: amount })
          // const invoice = request.paymentRequest
          if (isMobile) {
           window.location = `lightning:${invoice}`
            // let  clickedAt = new Date();
            // setTimeout(()=> {
            //     /(android)/i.test(navigator.userAgent) && 
            //     window.open('https://play.google.com/store/search?q=lightningwallet&c=apps');
            //   }, 3000)
          } else {
          const webln = await sync_lightning()
          const response = await webln.sendPayment(invoice)
          console.log(response)
          }
        } catch (err) { 
            console.log(err)
        }
    }
    
    const wrapped = {has_lightning, fetchLightning, sync_lightning, zap_lightning, subjktLightning}

    return (
      <LightningContext.Provider value={wrapped}>
             {children}
      </LightningContext.Provider>
    
    );
};

export default LightningContextProvider;
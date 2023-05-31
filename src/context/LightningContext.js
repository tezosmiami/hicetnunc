import { createContext, useContext} from "react";
import { HicetnuncContext } from './HicetnuncContext'
import { requestProvider } from "webln";
import { bytes2Char } from "@taquito/utils";
import { requestInvoice } from 'lnurl-pay'

const LightningContext = createContext();
const axios = require('axios')
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
        `!mesh`
      );
    }
    return lightning;
  };
  
const LightningContextProvider = ({ children }) => {
    const { acc, Tezos } = useContext(HicetnuncContext)
    // useEffect(() => {
    //   const loadLightning = async() => {
    //       let lnUrlOrAddress =  await fetchLightning(acc.address);
    //       setLightning(lnUrlOrAddress)
    //     }
    //   acc && loadLightning()
    //  }, [acc])

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
              comment: `Appreciation zap from ${acc?.address || 'anonymous'}`
          }) 
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
    
    const wrapped = {has_lightning, fetchLightning, sync_lightning, zap_lightning}

    return (
      <LightningContext.Provider value={wrapped}>
             {children}
      </LightningContext.Provider>
    
    );
};

export default LightningContextProvider;
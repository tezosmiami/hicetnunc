import { useState, useEffect, createContext, useContext} from "react";
import { HicetnuncContext } from './HicetnuncContext'
import { fetchGraphQL, getNameForAddress } from '../data/hicdex'
import { requestProvider } from "webln";
import { bytes2Char } from "@taquito/utils";
import { requestInvoice } from 'lnurl-pay'
import axios from 'axios'

const LightningContext = createContext();

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
    const { acc } = useContext(HicetnuncContext)
    const [sender, setSender] = useState(null)
    
    useEffect(() => {
      //move to h=n context
      const getAlias = async () => {
          acc && fetchGraphQL(getNameForAddress, 'GetNameForAddress', {
              address: acc.address,
              }).then(({ data, errors }) => {
              if (data) {
                  const holder = data.hic_et_nunc_holder[0]?.name || acc.address
                  setSender(holder)
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
              comment: `appreciation zap from ${sender || 'anonymous'} on magicCity`
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
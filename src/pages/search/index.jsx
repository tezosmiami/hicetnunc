import React, { Component } from 'react'
import { Page, Container, Padding } from '../../components/layout'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { Button, Primary } from '../../components/button'
import { getWalletAllowList } from '../../constants'
import { Friends } from '../friends'
import { Input } from '../../components/input'
import { FeedItem } from '../../components/feed-item'
import { getItem, setItem } from '../../utils/storage'
import { ObjktPost } from '../../components/objkt-post'
import { NeonSwitch } from '../../components/neon-switch'
import InfiniteScroll from 'react-infinite-scroll-component'
import './style.css'
import axios from 'axios'
import _ from 'lodash'

// const isFloat = (n) => Number(n) === n && n % 1 !== 0

async function fetchFeed(lastId, offset) {
  const { errors, data } = await fetchGraphQL(`
query LatestFeed {
  token(order_by: {id: desc}, limit: 21,  offset: ${offset}, where: {id: {_lte: ${lastId}}, supply: {_neq: "0"}, artifact_uri: {_neq: ""}}) {
    artifact_uri
    display_uri
    creator_id
    id
    mime
    royalties
    thumbnail_uri
    timestamp
    title
    description
    token_signatures {
      holder_id
    }
    supply
    swaps(where: {contract_version: {_eq: "2"}})   {
      is_valid
      id
      price
      status
      contract_version
    }
    token_holders(where: {quantity: {_gt: "0"}}) {
      holder_id
      quantity
    }
    creator {
      is_split
      address
      name
      metadata_file
      shares {
        sharesholder {
          holder_type
          holder_id
        }
      }
    }
  }
}`, "LatestFeed", {});
  if (errors) {
    console.error(errors);
  }
  const result = data.token
  return result
}

// const query_creations = `
// query creatorGallery($address: String!) {
//   token(where: {creator: {address: {_eq: $address}}, supply: {_gt: 0}}, order_by: {id: desc}, limit : 21, offset : $offset ) {
//     id
//     artifact_uri
//     display_uri
//     thumbnail_uri
//     timestamp
//     mime
//     title
//     description
//     supply
//     token_tags {
//       tag {
//         tag
//       }
//     }
//   }
// }
// `

// const query_tag = `
// query ObjktsByTag {
//   token(where: {supply : {_neq: "0"}, token_tags: {tag: {tag: {_eq: $tag}}}, id: {_lte: $lastId}}, limit : 21, order_by: {id: desc}) {
//     id
//     artifact_uri
//     display_uri
//     mime
//     token_tags {
//       tag {
//         tag
//       }
//     }
//     creator {
//       address
//       name
//     }
//   }
// }`

// async function fetchID(id) {
//   const { errors, data } = await fetchGraphQL(`
//   query objktId {
//     token(where : { id : { _eq : $id }}) {
//       id
//       artifact_uri
//       display_uri
//       mime
//       creator {
//         address
//         name
//       }
//     }
//   }
//   `, 'objktId', {
//     id: id
//   })

//   try {
//     return data.token
//   } catch (e) {
//     return undefined
//   }
// }

async function fetchObjkts(ids) {
  const { errors, data } = await fetchGraphQL(`
    query Objkts($ids: [bigint!] = "") {
      token(where: {id: {_in: $ids}, supply : {_neq: "0"}}) {
        artifact_uri
        display_uri
        creator_id
        id
        mime
        royalties
        thumbnail_uri
        timestamp
        title
        description
        token_signatures {
          holder_id
        }
        supply
        swaps(where: {contract_version: {_eq: "2"}})   {
          is_valid
          id
          price
          status
          contract_version
        }
        token_holders(where: {quantity: {_gt: "0"}}) {
          holder_id
          quantity
        }
        creator {
          is_split
          address
          name
          metadata_file
          shares {
            sharesholder {
              holder_type
              holder_id
            }
          }
        }
      }
    }
`, "Objkts", { "ids": ids });
  if (errors) {
    console.log(errors)
  }
  return data
}

async function getLastId() {
  const { errors, data } = await fetchGraphQL(`
    query LastId {
      token(limit: 1, order_by: {id: desc}) {
        id
      }
    }`, "LastId");
    if (errors) {
      console.log(errors)
    }
  return data.token[0].id
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

async function fetchGLB(offset) {
  const { errors, data } = await fetchGraphQL(`
  query GLBObjkts {
    token(where : { mime : {_in : ["model/gltf-binary"] }, supply : {_neq: "0"}}, limit : 21, offset : ${offset}, order_by: {id: desc}) {
      id
      artifact_uri
      display_uri
      mime
      creator_id
      creator {
        address
        name
      }
    }
  }
  `, 'GLBObjkts', {}
  )
  if (errors) {
    console.log(errors)
  }
  try {
    return data.token
  } catch (e) {
    return undefined
  }
}

async function fetchInteractive(offset) {
  const { errors, data } = await fetchGraphQL(`
    query InteractiveObjkts {
      token(where: { mime: {_in : [ "application/x-directory", "image/svg+xml" ]}, supply : {_neq: "0"}}, limit : 30, offset : ${offset}, order_by: {id: desc}) {
        id
        artifact_uri
        display_uri
        mime
        creator_id
        creator {
          name
          address
        }
      }
    }
  `, 'InteractiveObjkts', {})
  if (errors) {
    console.log(errors)
  }
  try {
    return data.token
  } catch (e) {
    return undefined
  }
}

async function fetchGifs(offset) {
  const { errors, data } = await fetchGraphQL(`
    query Gifs ($offset: Int = 0) {
      token(where: { mime: {_in : [ "image/gif" ]}, supply : { _neq: "0"}}, order_by: {id: desc}, limit: 21, offset: ${offset}) {
        id
        artifact_uri
        display_uri
        mime
        creator_id
        creator {
          name
          address
        }
      }
    }
  `, 'Gifs', {})
  if (errors) {
    console.log(errors)
  }
  try {
    return data.token
  } catch (e) {
    return undefined
  }
}

async function fetchMusic(offset) {
  const { errors, data } = await fetchGraphQL(`
  query AudioObjkts {
    token(where: {mime: {_in: ["audio/ogg", "audio/wav", "audio/mpeg"]}, supply : {_neq: "0"}}, limit : 21, offset : ${offset}, order_by: {id: desc}) {
      artifact_uri
      display_uri
      creator_id
      id
      mime
      royalties
      thumbnail_uri
      timestamp
      title
      description
      token_signatures {
        holder_id
      }
      supply
      swaps(where: {contract_version: {_eq: "2"}})   {
        is_valid
        id
        price
        status
        contract_version
      }
      token_holders(where: {quantity: {_gt: "0"}}) {
        holder_id
        quantity
      }
      creator {
        is_split
        address
        name
        metadata_file
        shares {
          sharesholder {
            holder_type
            holder_id
          }
        }
      }
    }
  }
  `, 'AudioObjkts', {}
  )
  if (errors) {
    console.log(errors)
  }
  try {
    return data.token
  } catch (e) {
    return undefined
  }
}

// async function fetchTitle(title, offset) {
//   const { errors, data } = await fetchGraphQL(`
//   query queryTitles {
//     token(where: {title: {_like: "%${title}%"}}) {
//       id
//       artifact_uri
//       display_uri
//       mime
//       creator {
//         address
//         name
//       }
//     }
//   }
//   `, 'queryTitles', {})

//   try {
//     return data.token
//   } catch (e) {
//     return undefined
//   }
// }

// async function fetchCreations(addr, offset) {
//   const { errors, data } = await fetchGraphQL(`
// query creatorGallery {
//   token(where: {creator: {address: {_eq: ${addr}}}, supply: {_gt: 0}}, order_by: {id: desc}, limit : 21, offset : ${offset} ) {
//     id
//     artifact_uri
//     display_uri
//     thumbnail_uri
//     timestamp
//     mime
//     title
//     description
//     supply
//     token_tags {
//       tag {
//         tag
//       }
//     }
//   }
// }
// `,
//     'creatorGallery',
//     {}
//   )
//   if (errors) {
//     console.error(errors)
//   }
//   const result = data.token
//   return result
// }

// async function fetchDescription(description, offset) {
//   const { errors, data } = await fetchGraphQL(`
//   query queryDescriptions {
//     token(where: {description: {_like: "%${description}%"}}) {
//       id
//       artifact_uri
//       display_uri
//       mime
//       creator {
//         address
//         name
//       }
//     }
//   }
//   `, 'queryDescriptions', {})

//   try {
//     return data.token
//   } catch (e) {
//     return undefined
//   }
// }

async function fetchRandomObjkts(lastId) {
  const firstId = 196
  const uniqueIds = new Set()
  while (uniqueIds.size < 21) {
    uniqueIds.add(rnd(firstId, lastId))
  }
  let objkts = await fetchObjkts(Array.from(uniqueIds));
  return objkts.token
}

async function fetchSwaps(offset) {
  const { errors, data } = await fetchGraphQL(`
  query querySwaps {
    swap(where: {contract_version: {_eq: "2"}, token: {supply: {_neq: "0"}}}, order_by: {id: desc}, limit: 21,  offset : ${offset}) {
      id
      royalties
      creator_id
      token {
        id
        title
        mime
        metadata
        artifact_uri
        display_uri
        description
        royalties
        is_signed
        token_signatures {
          holder_id
        }
        supply
        swaps(where: {contract_version: {_eq: "2"}}) {
          is_valid
          id
          price
          status
          contract_version
        }
        token_holders(where: {quantity: {_gt: "0"}}) {
          holder_id
          quantity
        }
        creator {
          is_split
          address
          name
          metadata_file
          shares {
            sharesholder {
              holder_type
              holder_id
            }
          }
        }
      }
    } 
  }
  `, 'querySwaps', {})
  if (errors) {
    console.log(errors)
  }
  try {
    return data.swap
  } catch (e) {
    return undefined
  }
}

async function fetchDay(day, offset) {
  const { errors, data } = await fetchGraphQL(`query dayTrades {
    trade(where: {timestamp: {_gte: "${day}"}}, order_by: {swap: {price: desc}}, limit : 21, offset : ${offset}) {
      timestamp
      swap {
        price
      }
      token {
        artifact_uri
        display_uri
        id
        mime
        title
        description
        royalties
        supply
        is_signed
        token_signatures {
          holder_id
        }
        supply
        swaps(where: {contract_version: {_eq: "2"}}) {
          is_valid
          id
          price
          status
          contract_version
        }
        token_holders(where: {quantity: {_gt: "0"}}) {
          holder_id
          quantity
        }
        creator {
          is_split
          address
          name
          metadata_file
          shares {
            sharesholder {
              holder_type
            }
          }
        }
      }
    }
  }
`, 'dayTrades', {})

  if (errors) {
    console.log(errors)
  }

  let result = []

  try {
    result = data.trade
  } catch (e) { }

  return result

}

async function fetchSales(offset) {
  const { errors, data } = await fetchGraphQL(`
  query sales {
    trade(order_by: {timestamp: desc}, limit : 21, offset : ${offset}, where: {swap: {price: {_gte: "500000"}}}) {
      timestamp
      token {
        artifact_uri
        display_uri
        id
        mime
        title
        description
        is_signed
        supply
        royalties
        token_holders(where: {quantity: {_gt: "0"}}) {
          holder_id
          quantity
        }
        swaps {
          price
          status
          is_valid
          contract_version
        }
        creator_id
        creator {
          name
          address
          metadata_file
          shares {
            sharesholder {
              holder_type
              holder_id
            }
          }
        }
        token_signatures {
          holder_id
        }
      }
    }
  }`, 'sales', {})
  if (errors) {
    console.log(errors)
  }
  let result = []
  try {
    result = data.trade
  } catch (e) { }

  return result

}

async function fetchSubjkts(subjkt) {
  const { errors, data } = await fetchGraphQL(`
  query subjktsQuery {
    holder(where: {name: {_ilike: "%${subjkt}%"}}, order_by: {hdao_balance: desc}) {
      address
      name
      hdao_balance
      metadata
    }
  }
  `, 'subjktsQuery', {})
  if (errors) {
    console.error(errors)
  }

  let result = []

  try {
    result = data.holder
  } catch (e) { }

  return result
}

export async function fetchTag(tag, offset) {
  const { errors, data } = await fetchGraphQL(
    `query ObjktsByTag {
  token(where: {supply: {_neq: "0"}, token_tags: {tag: {tag: {_in: ${tag}}}}}, offset: ${offset}, limit: 21, order_by: {id: desc}) {
    artifact_uri
    display_uri
    creator_id
    id
    mime
    royalties
    thumbnail_uri
    timestamp
    title
    description
    token_signatures {
      holder_id
    }
    supply
    swaps(where: {contract_version: {_eq: "2"}})   {
      is_valid
      id
      price
      status
      contract_version
    }
    token_holders(where: {quantity: {_gt: "0"}}) {
      holder_id
      quantity
    }
    creator {
      is_split
      address
      name
      metadata_file
      shares {
        sharesholder {
          holder_type
          holder_id
        }
      }
    }
  }
}
`, "ObjktsByTag", {});
  if (errors) {
    console.error(errors);
  }
  const result = data?.token
  return result
}


async function fetchAddresses(creator_ids) {
  const { errors, data } = await fetchGraphQL(`
    query Objkts($creator_ids: [String!] = "") {
      token(where: {creator_id: {_in: $creator_ids}, supply : {_neq: "0"}}, order_by: {timestamp: desc}, limit : 21) {
        artifact_uri
        display_uri
        creator_id
        id
        mime
        royalties
        thumbnail_uri
        timestamp
        title
        description
        token_signatures {
          holder_id
        }
        supply
        swaps(where: {contract_version: {_eq: "2"}})   {
          is_valid
          id
          price
          status
          contract_version
        }
        token_holders(where: {quantity: {_gt: "0"}}) {
          holder_id
          quantity
        }
        creator {
          is_split
          address
          name
          metadata_file
          shares {
            sharesholder {
              holder_type
              holder_id
            }
          }
        }
      }
    }
`, "Objkts", { "creator_ids": creator_ids });
  if (errors) {
    console.log(errors)
  }
  return data.token
}


async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(
    import.meta.env.VITE_GRAPHQL_API,
    {
      method: "POST",
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      })
    }
  );
  return await result.json();
}

const query_hdao = `query hDAOFeed($offset: Int = 0) {
  token(order_by: {hdao_balance: desc}, limit: 21, where: {supply: {_neq: "0"}, hdao_balance: {_gt: 100}}, offset: $offset) {
    artifact_uri
    display_uri
    creator_id
    id
    mime
    royalties
    thumbnail_uri
    timestamp
    title
    description
    token_signatures {
      holder_id
    }
    supply
    swaps(where: {contract_version: {_eq: "2"}})   {
      is_valid
      id
      price
      status
      contract_version
    }
    token_holders(where: {quantity: {_gt: "0"}}) {
      holder_id
      quantity
    }
    creator {
      is_split
      address
      name
      metadata_file
      shares {
        sharesholder {
          holder_type
          holder_id
        }
      }
    }
  }
}
`

async function fetchHdao(offset) {
  const { errors, data } = await fetchGraphQL(query_hdao, "hDAOFeed", { "offset": offset })
  if (errors) {
    console.error(errors);
  }
  const result = data.token
  return result
};


const getRestrictedAddresses = async () =>
  await axios
    .get(
      import.meta.env.VITE_BLOCKLIST_WALLET
    )
    .then((res) => res.data.filter( (a) => !getWalletAllowList().includes(a)))

export class Search extends Component {
  static contextType = HicetnuncContext
  
  state = {
    subjkt: [],
    items: [],
    feed: [],
    feedstyle: getItem('feedstyle') || 'post',
    neonstyle: getItem('neonstyle') || null,
    search: '',
    select: '',
    prev: '',
    reset: false,
    flag: false,
    lastId: undefined,
    tags: [
      { id: 0, value: 'new OBJKTs' },
      { id: 1, value: 'h=n swaps' },
      { id: 2, value: 'music' },
      { id: 3, value: 'photography' },
      { id: 4, value: 'ai' },
      { id: 5, value: 'random' },
      { id: 6, value: 'recent sales'},
      { id: 7, value: 'friends' }, 
      // { id: 7, value: '🗑️' },
      // { id: 7, value: 'gif' },
      // { id: 6, value: 'html/svg' }, // algorithimc?
      // { id: 4, value: 'glb' },
      { id: 8, value: '1D' },
      { id: 9, value: '1W' },
      { id: 10, value: '1M' },
      
      // { id: 10, value: 'ATH' },
      { id: 11, value: '○ hDAO' },
      
      { id: 12, value: 'Miami' },
      { id: 13, value: <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"></path></svg>},
      
   
      
      
    ],
    mouse: false,
    hasMore: true,
    offset: 0
  }

  componentDidMount = async () => {
    window.addEventListener('neon', () => this.setState({neonstyle: getItem('neonstyle')}))
    // let arr = await getRestrictedAddresses()
    // this.setState({ select: 'new OBJKTs' })
    // let res1 = await fetchTag(( 'teztrash'), 9999999)
    // let res2 = await fetchTag(( 'tezflowers'), 9999999)
    // let resTotal = res1.concat(res2).sort((a,b) => b.id - a.id)
    // resTotal = resTotal.filter(e => !arr.includes(e.creator_id))

    // let swaps = await fetchSwaps((this.state.offset))
    // swaps.forEach(e => { e.creator = e.token.creator; e.id = e.token.id});
    // swaps = swaps.filter(e => !arr.includes(e.creator.address))
    // this.setState({ feed: _.uniqBy([...this.state.feed, ...swaps], 'id') })

    // this.setState({ feed: [...this.state.feed, ...(swaps)] }) 
    // this.setState({ select: 'recent sales' })
    // let tokens = await fetchSales(this.state.offset)
    // tokens = tokens.map(e => e.token)
    // let tokens = await fetchFeed(this.state.offset)
    // tokens = tokens.map(e => e.token)
    // tokens = tokens.filter(e => !arr.includes(e.creator_id))
    // this.setState({ feed: _.uniqBy(_.uniqBy([...this.state.feed, ...tokens], 'id'), 'creator_id') })
     await this.update(getItem('mainfeed') ||  'new OBJKTs', true)
  }

  componentWillUnmount = () => {
    window.removeEventListener('neon', () => this.setState({neonstyle: getItem('neonstyle')}))
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })

    //if (this.state.search.length >= 1) this.search()
  }

  update = async (e, reset) => {
    let arr = await getRestrictedAddresses()
    this.setState({ select: e.type === 'new OBJKTs' ? 'new OBJKTs' : e })
    setItem('mainfeed', e.type === 'new OBJKTs' ? '' : e)
    let lastId = await getLastId()
    if (reset) {
      this.setState({ flag: false })
      this.setState({ feed: [] })
      this.setState({ offset: 0 })
      this.setState({ lastId: lastId })
    }
    if (e === '1D') {

      let list = await fetchDay(new Date((new Date()).getTime() - 60 * 60 * 24 * 1000).toISOString(), this.state.offset)
      list = list.map(e => e.token)
      list = [...this.state.feed, ...(list)]
      list = list.filter(e => !arr.includes(e.creator.address))
      list = _.uniqBy(list, 'id')

      this.setState({
        feed: list
      })
    }

    if (e === '1W') {
      let list = await fetchDay(new Date((new Date()).getTime() - 60 * 60 * 24 * 7 * 1000).toISOString(), this.state.offset)
      list = list.map(e => e.token)
      list = [...this.state.feed, ...(list)]
      list = list.filter(e => !arr.includes(e.creator.address))

      list = _.uniqBy(list, 'id')

      this.setState({
        feed: list
      })
    }


    if (e === '1M') {
      let list = await fetchDay(new Date((new Date()).getTime() - 60 * 60 * 24 * 30 * 1000).toISOString(), this.state.offset)
      list = list.map(e => e.token)
      list = [...this.state.feed, ...(list)]
      list = list.filter(e => !arr.includes(e.creator.address))
      list = _.uniqBy(list, 'id')
      this.setState({
        feed: list
      })
    }

    if (e === 'ATH') {
      let list = await fetchDay(new Date('2021-05-01').toISOString(), this.state.offset)
      list = list.map(e => e.token)
      list = [...this.state.feed, ...(list)]
      list = _.uniqBy(list, 'id')
      this.setState({
        feed: list
      })
    }

    if (e === 'num') {
      let res = await fetchFeed(Number(this.state.search) + 1 - this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({
        feed: [...this.state.feed, ...(res)]
      })
    }

    if (e === '○ hDAO') {
      let res = await fetchHdao(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy(_.uniqBy([...this.state.feed, ...(res)], 'id'), 'creator_id'), hdao: true })
    }

    if (e === 'music') {
      let res = await fetchMusic(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'video') {

    }

    if (e === 'glb') {
      let res = await fetchGLB(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'html/svg') {
      let res = await fetchInteractive(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'random') {
      let res = await fetchRandomObjkts(lastId)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: [...this.state.feed, ...(res)] })
    }

    if (e === 'gif') {
      let res = await fetchGifs(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'illustration') {
      //console.log(await fetchTag('illustration'))
    }

    // if (e === 'Event') {
    //   let res = await fetchTag('teztrash', 999999)
    //   res = res.filter(e => !arr.includes(e.creator_id))
    //   this.setState({ feed: ([...this.state.feed, ...(res)]) })
    // }

    if (e === 'photography') {
      let res = await fetchTag('photography', this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: ([...this.state.feed, ...(res)]) })
    }

  
    if (e === 'tag') {
      let res = await fetchTag(this.state.search, this.state.feed[this.state.feed.length - 1].id)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'recent sales') {
      let tokens = await fetchSales(this.state.offset)
      tokens = tokens.map(e => e.token)
      tokens = tokens.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy(_.uniqBy([...this.state.feed, ...tokens], 'id'), 'creator_id') })
    }

    if (e === 'h=n swaps') {
      let tokens = await fetchSwaps(this.state.offset)
      tokens.forEach(e => { e.creator = e.token.creator; e.id = e.token.id});
      tokens = tokens.filter(e => !arr.includes(e.creator.address))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...tokens], 'id') })
      // this.setState({ feed: _.uniqBy([...this.state.feed, ...tokens], 'id')})
    }

    if (e === 'Miami') {
      let res = await fetchTag('miami', this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: ([...this.state.feed, ...(res)]) })
    }
    
    if (e === 'ai') {
      let res = await fetchTag('ai', this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: ([...this.state.feed, ...(res)]) })
    }


    if (e === '🗑️') {
      let res = await fetchTag(`trashart`, this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: ([...this.state.feed, ...(res)]) })
    }
    
    if (e === 'friends') {
      this.setState({ select: 'friends' }) 
    }

    if (this.state.select === 'new OBJKTs') {
      let res = await fetchFeed(lastId, this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      // this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
      this.setState({ feed: [...this.state.feed, ...(res)] })
    }

    if (this.state.select.type === 'svg') {
      try{
        const result = await axios.get(`https://api.tzkt.io/v1/bigmaps/464343/keys/`)
        let creator_ids = result.data.map((d) => {return d.key})
        let objkts = await fetchAddresses(Array.from(creator_ids))
        this.setState({ feed: ([...this.state.feed, ...(objkts)]) })
      } catch (err) {
        console.log(err)
      }
    }

    // new listings

    this.setState({ reset: false })

  }

  // latest = async () => {
  //   let result = []
  //   if (this.state.flag) {
  //     result = await fetchFeed(Math.min.apply(Math, this.state.feed.map(e => e.id)), this.state.offset)
  //   } else {
  //     result = await fetchFeed(999999, this.state.offset)
  //   }
  //   let restricted = await getRestrictedAddresses()
  //   result = _.uniqBy([...this.state.feed, ...result], 'creator_id')
  //   result = result.filter(e => !restricted.includes(e.creator_id))
  //   this.setState({ feed: [...result], flag: true })
  // }

  search = async (e) => {
    this.setState({ items: [], feed: [], search: e })
    this.setState({ subjkt: await fetchSubjkts(this.state.search) })

    if (!isNaN(this.state.search)) {
      this.setState({ feed: await fetchFeed(Number(this.state.search) + 1), select: 'num' })
    } else {
      this.setState({ feed: (await fetchTag(this.state.search.toLowerCase(), 9999999)), select: 'tag' })
    }
  }

  hoverState = (bool) => this.setState({ mouse: bool })

  select = (id) => this.setState({ select: [...this.state.select, id] })

  loadMore = () => {
    this.setState({ offset: this.state.offset + 21 })
    this.update(this.state.select, false)
  }

  handleKey = (e) => {
    if (e.key === 'Enter') this.search(this.state.search)
  }
  
  switchStyle = () => {
      if (this.state.feedstyle === 'original') {
        setItem('feedstyle', 'post')
        this.setState({ feedstyle: 'post' })    
      } else {
        setItem('feedstyle', 'original') 
        this.setState({ feedstyle: 'original' })
      }
    }
   
  render() {
    return (
      <Page>
         {
          // this.state.feed.length < 1  &&
          <div className='info'>
              {/* indexer down -&nbsp; */}
              {/* <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"></path></svg>&nbsp;{`->`}&nbsp;
              {this.context.acc ? <Button to='/config'>register</Button> : 'zap'} */}
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 875 875">
  <                     path className="nostr" d="m684.72,485.57c.22,12.59-11.93,51.47-38.67,81.3-26.74,29.83-56.02,20.85-58.42,20.16s-3.09-4.46-7.89-3.77-9.6,6.17-18.86,7.2-17.49,1.71-26.06-1.37c-4.46.69-5.14.71-7.2,2.24s-17.83,10.79-21.6,11.47c0,7.2-1.37,44.57,0,55.89s3.77,25.71,7.54,36c3.77,10.29,2.74,10.63,7.54,9.94s13.37.34,15.77,4.11c2.4,3.77,1.37,6.51,5.49,8.23s60.69,17.14,99.43,19.2c26.74.69,42.86,2.74,52.12,19.54,1.37,7.89,7.54,13.03,11.31,14.06s8.23,2.06,12,5.83,1.03,8.23,5.49,11.66c4.46,3.43,14.74,8.57,25.37,13.71,10.63,5.14,15.09,13.37,15.77,16.11s1.71,10.97,1.71,10.97c0,0-8.91,0-10.97-2.06s-2.74-5.83-2.74-5.83c0,0-6.17,1.03-7.54,3.43s.69,2.74-7.89.69-11.66-3.77-18.17-8.57c-6.51-4.8-16.46-17.14-25.03-16.8,4.11,8.23,5.83,8.23,10.63,10.97s8.23,5.83,8.23,5.83l-7.2,4.46s-4.46,2.06-14.74-.69-11.66-4.46-12.69-10.63,0-9.26-2.74-14.4-4.11-15.77-22.29-21.26c-18.17-5.49-66.52-21.26-100.12-24.69s-22.63-2.74-28.11-1.37-15.77,4.46-26.4-1.37c-10.63-5.83-16.8-13.71-17.49-20.23s-1.71-10.97,0-19.2,3.43-19.89,1.71-26.74-14.06-55.89-19.89-64.12c-13.03,1.03-50.74-.69-50.74-.69,0,0-2.4-.69-17.49,5.83s-36.48,13.76-46.77,19.93-14.4,9.7-16.12,13.13c.12,3-1.23,7.72-2.79,9.06s-12.48,2.42-12.48,2.42c0,0-5.85,5.86-8.25,9.97-6.86,9.6-55.2,125.14-66.52,149.83-13.54,32.57-9.77,27.43-37.71,27.43s-8.06.3-8.06.3c0,0-12.34,5.88-16.8,5.88s-18.86-2.4-26.4,0-16.46,9.26-23.31,10.29-4.95-1.34-8.38-3.74c-4-.21-14.27-.12-14.27-.12,0,0,1.74-6.51,7.91-10.88,8.23-5.83,25.37-16.11,34.63-21.26s17.49-7.89,23.31-9.26,18.51-6.17,30.51-9.94,19.54-8.23,29.83-31.54c10.29-23.31,50.4-111.43,51.43-116.23.63-2.96,3.73-6.48,4.8-15.09.66-5.35-2.49-13.04,1.71-22.63,10.97-25.03,21.6-20.23,26.4-20.23s17.14.34,26.4-1.37,15.43-2.74,24.69-7.89,11.31-8.91,11.31-8.91l-19.89-3.43s-18.51.69-25.03-4.46-15.43-15.77-15.43-15.77l-7.54-7.2,1.03,8.57s-5.14-8.91-6.51-10.29-8.57-6.51-11.31-11.31-7.54-25.03-7.54-25.03l-6.17,13.03-1.71-18.86-5.14,7.2-2.74-16.11-4.8,8.23-3.43-14.4-5.83,4.46-2.4-10.29-5.83-3.43s-14.06-9.26-16.46-9.6-4.46,3.43-4.46,3.43l1.37,12-12.2-6.27-7-11.9s2.36,4.01-9.62,7.53c-20.55,0-21.89-2.28-24.93-3.94-1.31-6.56-5.57-10.11-5.57-10.11h-20.57l-.34-6.86-7.89,3.09.69-10.29h-14.06l1.03-11.31h-8.91s3.09-9.26,25.71-22.97,25.03-16.46,46.29-17.14c21.26-.69,32.91,2.74,46.29,8.23s38.74,13.71,43.89,17.49c11.31-9.94,28.46-19.89,34.29-19.89,1.03-2.4,6.19-12.33,17.96-17.6,35.31-15.81,108.13-34,131.53-35.54,31.2-2.06,7.89-1.37,39.09,2.06,31.2,3.43,54.17,7.54,69.6,12.69,12.58,4.19,25.03,9.6,34.29,2.06,4.33-1.81,11.81-1.34,17.83-5.14,30.69-25.09,34.72-32.35,43.63-41.95s20.14-24.91,22.54-45.14,4.46-58.29-10.63-88.12-28.8-45.26-34.63-69.26c-5.83-24-8.23-61.03-6.17-73.03,2.06-12,5.14-22.29,6.86-30.51s9.94-14.74,19.89-16.46c9.94-1.71,17.83,1.37,22.29,4.8,4.46,3.43,11.65,6.28,13.37,10.29.34,1.71-1.37,6.51,8.23,8.23,9.6,1.71,16.05,4.16,16.05,4.16,0,0,15.64,4.29,3.11,7.73-12.69,2.06-20.52-.71-24.29,1.69s-7.21,10.08-9.61,11.1-7.2.34-12,4.11-9.6,6.86-12.69,14.4-5.49,15.77-3.43,26.74,8.57,31.54,14.4,43.2c5.83,11.66,20.23,40.8,24.34,47.66s15.77,29.49,16.8,53.83,1.03,44.23,0,54.86-10.84,51.65-35.53,85.94c-8.16,14.14-23.21,31.9-24.67,35.03-1.45,3.13-3.02,4.88-1.61,7.65,4.62,9.05,12.87,22.13,14.71,29.22,2.29,6.64,6.99,16.13,7.22,28.72Z"/>
                    </svg> &nbsp;{` -> `}&nbsp;
              {this.context.acc ? <Button to='/config'>   nostr for dms</Button> :  <Button to='/sync'>   sync and link nostr</Button>}
              {/* <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"></path></svg>  */}
            </div>
          }
        <Container>
          <Padding>
              <div style={{display: 'flex', flexDirection: 'row'}}>
                <Input
                  type="text"
                  name="search"
                  onChange={this.handleChange}
                  label="search ↵"
                  placeholder="search ↵"
                  onKeyPress={this.handleKey}
                />
                <div style={{ display: 'flex', flexDirection: 'row', marginRight: '18px'}}>
                  <NeonSwitch /> &nbsp;
                  <Button onClick={this.switchStyle}>
                      <Primary>
                        {this.state.feedstyle === 'post' ? <svg stroke="currentColor" fill="none" strokeWidth="0" viewBox="0 0 24 24" height="27px" width="27px" xmlns="http://www.w3.org/2000/svg"><path d="M3 21V3H5V21H3Z" fill="currentColor"></path><path fillRule="evenodd" clipRule="evenodd" d="M7 3H17V21H7V3ZM9 5V19H15V5H9Z" fill="currentColor"></path><path d="M19 3V21H21V3H19Z" fill="currentColor"></path></svg>
                          : <svg stroke="currentColor" fill="none" strokeWidth="0" viewBox="0 0 24 24" height="27px" width="27px" xmlns="http://www.w3.org/2000/svg"><path d="M12.552 8C11.9997 8 11.552 8.44772 11.552 9C11.552 9.55228 11.9997 10 12.552 10H16.552C17.1043 10 17.552 9.55228 17.552 9C17.552 8.44772 17.1043 8 16.552 8H12.552Z" fill="currentColor" fillOpacity="0.5"></path><path d="M12.552 17C11.9997 17 11.552 17.4477 11.552 18C11.552 18.5523 11.9997 19 12.552 19H16.552C17.1043 19 17.552 18.5523 17.552 18C17.552 17.4477 17.1043 17 16.552 17H12.552Z" fill="currentColor" fillOpacity="0.5"></path><path d="M12.552 5C11.9997 5 11.552 5.44772 11.552 6C11.552 6.55228 11.9997 7 12.552 7H20.552C21.1043 7 21.552 6.55228 21.552 6C21.552 5.44772 21.1043 5 20.552 5H12.552Z" fill="currentColor" fillOpacity="0.8"></path><path d="M12.552 14C11.9997 14 11.552 14.4477 11.552 15C11.552 15.5523 11.9997 16 12.552 16H20.552C21.1043 16 21.552 15.5523 21.552 15C21.552 14.4477 21.1043 14 20.552 14H12.552Z" fill="currentColor" fillOpacity="0.8"></path><path d="M3.448 4.00208C2.89571 4.00208 2.448 4.44979 2.448 5.00208V10.0021C2.448 10.5544 2.89571 11.0021 3.448 11.0021H8.448C9.00028 11.0021 9.448 10.5544 9.448 10.0021V5.00208C9.448 4.44979 9.00028 4.00208 8.448 4.00208H3.448Z" fill="currentColor"></path><path d="M3.448 12.9979C2.89571 12.9979 2.448 13.4456 2.448 13.9979V18.9979C2.448 19.5502 2.89571 19.9979 3.448 19.9979H8.448C9.00028 19.9979 9.448 19.5502 9.448 18.9979V13.9979C9.448 13.4456 9.00028 12.9979 8.448 12.9979H3.448Z" fill="currentColor"></path></svg>
                        }
                      </Primary>
                  </Button>
                </div>
              </div>
            {
              <div style={{ marginTop: '15px' }}>
                {this.state.tags.map((e,i) => <div key={i} className='tag' href='#'
                   style= {{boxShadow: (e.value === this.state.select || (e.id === 13 && this.state.select.type ==='svg'))  && 'var(--box-shadow)', 
                    textDecoration: e.value === this.state.select && (this.state.neonstyle === false || this.state.neonstyle === null) ? 'underline' : ''}} onClick={() => {
                  this.update(e.value ? e.value : 'svg', true)
                }}>{e.value}</div>)}
              </div>
            }
            {
              (this.state.subjkt.length > 0) && (this.state.search !== "") ?
                <div style={{ maxHeight: '200px', overflow: 'scroll' }}>
                  {
                    this.state.subjkt.map((e,i) => <div key={i} style={{ marginTop: '10px' }}><a href={`/${e.name}`}>{e.name}</a> {e.metadata.description}</div>)
                  }
                </div>
                :
                undefined
            }
          </Padding>
        </Container>
        {this.context.acc && this.state.select === 'friends' ?
          <Friends feedstyle={this.state.feedstyle} wallet={this.context.acc.address} />
          :
        <Container xlarge>
          {this.state.feed.length > 0 ?
              <InfiniteScroll
                dataLength={this.state.feed.length}
                next={this.loadMore}
                hasMore={this.state.hasMore}
                loader={undefined}
                endMessage={undefined}
              >
                <Container>
                  <Padding>
                    {this.state.feed.map((item, index) => (
                       this.state.feedstyle === 'post' ? <ObjktPost key={`${item.id}-${index}`} {...item} />
                        : <FeedItem key={`${item.id}-${index}`} {...item} />
                       ))}
                  </Padding>
                </Container>
              </InfiniteScroll>
              :
              undefined
            }
        </Container>
        }
      </Page>
    )
  }
}

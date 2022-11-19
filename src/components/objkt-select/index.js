import React, { Component } from 'react'
import { Button, Primary, Secondary, Purchase } from '../../components/button'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { Page, Container, Padding } from '../../components/layout'
import { Loading } from '../../components/loading'
import { renderMediaType } from '../../components/media-types'
import { walletPreview } from '../../utils/string'
import { getWalletAllowList } from '../../constants'
import { ResponsiveMasonry } from '../../components/responsive-masonry'
import InfiniteScroll from 'react-infinite-scroll-component'
// import { CollabsTab } from '../collab/show/CollabsTab'
import styles from './styles.module.scss'
import { toggle } from 'screenfull'

const axios = require('axios')
const fetch = require('node-fetch')

const sortByTokenId = (a, b) => {
  return b.id - a.id
}

export const getRestrictedAddresses = async () =>
  await axios
    .get(
      'https://raw.githubusercontent.com/teia-community/teia-report/main/restricted.json'
    )
    .then((res) => res.data.filter((a) => !getWalletAllowList().includes(a)))

export const query_collection = `
query collectorGallery($address: String!, $offset: Int!) {
  hic_et_nunc_token_holder(where: {holder_id: {_eq: $address}, token: {creator: {address: {_neq: $address}}}, quantity: {_gt: "0"}}, order_by: {token_id: desc}, offset : $offset) {
    token {
      id
      artifact_uri
      display_uri
      thumbnail_uri
      timestamp
      mime
      title
      description
      creator {
        address
        name
      }
    }
  }
}
`

async function fetchGraphQL(operationsDoc, operationName, variables) {
  let result = await fetch(process.env.REACT_APP_GRAPHQL_API, {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName,
    }),
  })
  return await result.json()
}

export async function fetchCollection(addr, offset = 0) {
  const { errors, data } = await fetchGraphQL(
    query_collection,
    'collectorGallery',
    { address: addr,
      offset: offset }
  )
  if (errors) {
    console.error(errors)
  }
  const result = data.hic_et_nunc_token_holder
  return result
}

const query_creations = `
query creatorGallery($address: String!) {
  hic_et_nunc_token(where: {creator: {address: {_eq: $address}}, supply: {_gt: 0}}, order_by: {id: desc}) {
    id
    artifact_uri
    display_uri
    mime
    title
    swaps(order_by: {price: asc}, limit: 1, where: {amount_left: {_gte: "1"}, contract_version: {_eq: "2"}, status: {_eq: "0"}}) {
      id
      creator_id
      creator {
        address
      }
    }
  }
}
`

const query_v2_swaps = `
query querySwaps($address: String!) {
  hic_et_nunc_swap(where: {token: {creator: {address: {_neq: $address}}}, creator_id: {_eq: $address}, status: {_eq: "0"}, contract_version: {_eq: "2"}}, distinct_on: token_id) {
    creator_id
    token {
      id
      title
      artifact_uri
      display_uri
      mime
      description
      creator {
        name
        address
      }
    }
  }
}
`

async function fetchV2Swaps(address) {
  const { errors, data } = await fetchGraphQL(query_v2_swaps, 'querySwaps', {
    address: address
  })
  if (errors) {
    console.error(errors)
  }
  const result = data.hic_et_nunc_swap
  return result
}


async function fetchCreations(addr) {
  const { errors, data } = await fetchGraphQL(
    query_creations,
    'creatorGallery',
    { address: addr }
  )
  if (errors) {
    console.error(errors)
  }
  const result = data.hic_et_nunc_token
  return result
}



export default class Select extends Component {
  static contextType = HicetnuncContext
  constructor(props) {
    super(props)

  this.state = {
    wallet: '',
    selected: '',
    render: false,
    loading: true,
    hasMore: true,
    restricted: false,
    offset: 0,
    results: [],
    objkts: [],
    creations: [],
    collection: [],
    // collabs: [],
    forSale: [],
    notForSale: [],
    items: [],
    send: false,
    sortPrice: '',
    sortId: 'desc',
    creationsState: true,
    collectionState: false,
    // collabsState: false,
    collectionType: 'notForSale',
    // showUnverifiedCollabObjkts: false,
  }
}

  componentWillMount = async () => {
      const wallet = this.props.address
      this.setState({
        wallet,
        walletPreview: walletPreview(wallet),
      })
      this.onReady()
}

  reset() {
    this.setState({
      items: [],
      objkts: [],
      render: false,
      loading: true,
      hasMore: true,
    })
  }

  creations = async () => {
    this.setState({
      creationsState: true,
      collectionState: false,
    //   collabsState: false,
      sortId:'desc',
      sortPrice:'',
      collectionType: 'notForSale'
    })

    this.reset()

    let list = await getRestrictedAddresses()
    if (!list.includes(this.state.wallet)) {
      this.setState({ creations: await fetchCreations(this.state.wallet) })
      this.setState({ objkts: this.state.creations, loading: false, items: [] })
    } else {
      this.setState({ restricted: true, loading: false })
    }
    this.setState({ items: this.state.objkts.slice(0, 15), offset: 15 })
  }

  creationsNotForSale = async () => {
    this.setState({ collectionType: 'notForSale' })

    this.setState({
      objkts: await this.filterCreationsNotForSale(this.state.objkts), loading: false, items: []
    })

    this.setState({ items: this.state.objkts.slice(0, 15), offset: 15 })
  }

  filterCreationsNotForSale = async () => {
    let objkts = this.state.creations.filter(item => {
      return item.swaps.length === 0
    });

    return objkts
  }

  creationsForSale = async (forSaleType) => {
    this.setState({ collectionType: 'forSale' })
    this.setState({ objkts: this.state.creations, loading: false, items: [] })

    if (forSaleType !== null) {
      if (forSaleType == 0) {
        this.setState({
          objkts: await this.filterCreationsForSalePrimary(this.state.objkts)
        })
      } else if (forSaleType == 1) {
        this.setState({
          objkts: await this.filterCreationsForSaleSecondary(this.state.objkts)
        })
      }
    } else {
      console.log("forSaleType is null")
    }

    this.setState({ items: this.state.objkts.slice(0, 15), offset: 15 })
  }

  filterCreationsForSalePrimary = async () => {
    let objkts = this.state.creations.filter(item => {
      const swaps = item.swaps.filter(swaps => {
        return swaps.status == 0 && swaps.contract_version == 2 && swaps.creator_id == this.state.wallet
      })
      return swaps && swaps.length > 0
    });

    return objkts
  }

  filterCreationsForSaleSecondary = async () => {
    let objkts = this.state.creations.filter(item => {
      const swaps = item.swaps.filter(swaps => {
        return swaps.status == 0 && swaps.creator_id !== this.state.wallet
      })
      return swaps && swaps.length > 0
    });

    return objkts
  }

  combineCollection = async (collection, swaps) => {
    let combinedCollection = [];

    collection.forEach(function (item) {
      combinedCollection.push(item)
    })

    swaps.forEach(function (item) {
      combinedCollection.push(item)
    })

    return combinedCollection;
  }

  sortCollection = async (unsorted) => {
    unsorted.sort(function (a, b) {
      return b.token.id - a.token.id
    })
  }

  collectionFull = async () => {
    this.reset()

    this.setState({
      creationsState: false,
      collectionState: true,
    //   collabsState: false,
      sortId:'desc',
      sortPrice:''
    })

    this.setState({ collectionType: 'notForSale' })

    let list = await getRestrictedAddresses()
    if (!list.includes(this.state.wallet)) {
      this.setState({ loading: false, items: [] })
      let collection = await fetchCollection(this.state.wallet)
      let offset = 0
      while (collection.length % 500 === 0) {
        offset = offset+500
        collection = collection.concat(await fetchCollection(this.state.wallet, offset))
      }
      let swaps = await fetchV2Swaps(this.state.wallet)
      let combinedCollection = await this.combineCollection(collection, swaps)
      this.sortCollection(combinedCollection)
      this.setState({ collection: combinedCollection })
    } else {
      this.setState({ restricted: true, loading: false })
    }

    this.setState({ objkts: this.state.collection, loading: false, items: [] })
    this.setState({ items: this.state.objkts.slice(0, 15), offset: 15 })

  }

//   collabs = async () => {
//     let list = await getRestrictedAddresses()

//     if (!list.includes(this.state.wallet)) {

//       this.setState({
//         objkts: [],
//         loading: true,
//         creationsState: false,
//         collectionState: false,
//         collabsState: true,
//       })
//     }

//     this.updateLocation('collabs')
//   }

  sortByPrice = () =>{ 
    if (!this.state.sortPrice || this.state.sortPrice === 'desc') {
      this.setState({ objkts: (this.state.objkts.sort((a, b) => 
         parseFloat(a.swaps[0]?.price || 0) - parseFloat(b.swaps[0]?.price || 0))
        .filter(objkts => {return objkts.swaps[0] != null})) }) 
      this.setState({ items: this.state.objkts
        .filter(objkts => {return objkts.swaps[0] != null})
        .slice(0, 15), offset: 15 })
      this.setState({ sortPrice: 'asc' })
    }

    else {
      this.setState({ objkts: (this.state.objkts.sort((a, b) => 
        parseFloat(b.swaps[0]?.price || 0) - parseFloat(a.swaps[0]?.price || 0))) }) 
      this.setState({ items: this.state.objkts.slice(0, 15)
        .filter(objkts => {return objkts.swaps[0] != null}), offset: 15 })
      this.setState({ sortPrice: 'desc' });
    }
  }
  sortById = () =>{ 
    if (this.state.sortId =='desc') {
      this.setState({ objkts: this.state.objkts
        .sort((a, b) => parseFloat(this.state.collectionState ? a.token.id : a.id)
        - parseFloat(this.state.collectionState ? b.token.id : b.id)) }) 
      this.setState({ items: this.state.objkts
        .slice(0, 15), offset: 15 })
      this.setState({ sortId: 'asc' })}
    else {
      this.setState({ objkts: this.state.objkts
        .sort((a, b) => parseFloat(this.state.collectionState ? b.token.id : b.id)
        - parseFloat(this.state.collectionState ? a.token.id : a.id)) })
      this.setState({ items: this.state.objkts
        .slice(0, 15), offset: 15 })
      this.setState({ sortId: 'desc' });
    }
  }
  

  collectionForSale = async () => {
    this.setState({ collectionType: 'forSale' })

    let v1Swaps = this.state.marketV1.filter(item => {
      const objkts = item.token.creator.address !== this.state.wallet
      return objkts
    })

    this.setState({ marketV1: v1Swaps, loading: false })

    this.setState({ objkts: await this.filterCollectionForSale(this.state.objkts), loading: false, items: [] })
    this.setState({ items: this.state.objkts.slice(0, 15), offset: 15 })
  }

  collectionNotForSale = async () => {
    this.reset();
    this.setState({ collectionType: 'notForSale' })

    this.setState({ objkts: await this.filterCollectionNotForSale(this.state.objkts), loading: false, items: [] })
    this.setState({ items: this.state.objkts.slice(0, 15), offset: 15 })
  }

  filterCollectionNotForSale = async () => {
    let objktsNotForSale = this.state.collection.filter(item => item.token.creator.address !== this.state.wallet && item.creator_id !== this.state.wallet)
    return objktsNotForSale
  }

  filterCollectionForSale = async () => {
    let objktsForSale = this.state.collection.filter(item => item.creator_id == this.state.wallet)
    return objktsForSale
  }

  

  // called if there's no redirect
  onReady = async () => {

    // Make sure it's in the allowed tabs. If not, default to creations
    let tabFunc = 'creations';

    this[tabFunc]()
  }

  loadMore = () => {
    this.setState({ items: this.state.items.concat(this.state.objkts.slice(this.state.offset, this.state.offset + 20)), offset: this.state.offset + 20 })
  }

  updateSelected = (id) => {
    this.state.selected ? this.setState({ selected: '' }) : this.setState({ selected: id })
  }

  exit = () =>{
    this.props.setCollapsed(true)
  }
  sendObjkt = () => {
    if (!this.state.selected) return
    this.props.setObjkt(this.state.selected)
    this.props.setCollapsed(true)
  }

  // const isCollab = this.state.wallet

  render() {
      return (
      <Page title={this.state.alias}>
           {this.state.wallet.substr(0, 2) !== 'KT' && (
          <Container>
            <Padding>
              <div className={styles.menu}>
              <div onClick={this.exit} style={{margin: '18px', textAlign:'right'}}>[X]</div> 
                <Button onClick={this.creations}>
                  <Primary selected={this.state.creationsState}>
                    creations
                  </Primary>
                </Button>
                <Button onClick={this.collectionFull}>
                  <Primary selected={this.state.collectionState}>
                    collection
                  </Primary>
                </Button>
                {/* <Button onClick={this.collabs}>
                  <Primary selected={this.state.collabsState}>
                    collabs
                  </Primary>
                </Button>               */} 
                <div className={styles.filter}>
               
                {this.state.creationsState && 
                <Button
                      onClick={() => {
                        this.sortByPrice();
                      }}>
                      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="22" height="22" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M8 16H4l6 6V2H8zm6-11v17h2V8h4l-6-6z" fill="currentColor"/></svg>
                    </Button>}&nbsp;
                    <Button
                      onClick={() => {
                        this.sortById();
                      }}>
                      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="22" height="22" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M8 16H4l6 6V2H8zm6-11v17h2V8h4l-6-6z" fill="currentColor"/></svg>
                    </Button>&nbsp;&nbsp;
                    
                  <Button onClick={() => this.setState({
                    filter: !this.state.filter
                  })}>
                    <Primary>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-filter">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                    </Primary>
                  </Button>
                </div>
              </div>
            </Padding>
          </Container>
        )}
   

        {this.state.loading && (
          <Container>
            <Padding>
              <Loading />
            </Padding>
          </Container>
        )}

        {
          !this.state.loading && this.state.restricted && (
            <Container>
              <Padding>
                <div style={{ color: 'white', background: 'black', textAlign: 'center' }}>
                  restricted account
                </div>
              </Padding>
            </Container>
          )
        }

        {!this.state.loading && this.state.creationsState && (
          <div>
            <Container>
              <Padding>
                {this.state.filter && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      onClick={() => { this.creations() }}>
                      <div className={styles.tag}>
                        all
                      </div>
                    </Button>
                    <Button
                      onClick={() => {
                        this.creationsForSale(0);
                      }}>
                      <div className={styles.tag}>
                        primary
                      </div>
                    </Button>
                    <Button
                      onClick={() => {
                        this.creationsForSale(1);
                      }}>
                      <div className={styles.tag}>
                        secondary
                      </div>
                    </Button>
                    <Button
                      onClick={() => { this.creationsNotForSale() }}>
                      <div className={styles.tag}>
                        not for sale
                      </div>
                    </Button>
                  </div>
                )}
              </Padding>
            </Container>

      
            <Container>    
              <InfiniteScroll
                dataLength={this.state.items.length}
                next={this.loadMore}
                hasMore={this.state.hasMore}
                loader={undefined}
                endMessage={undefined}
              >
                <ResponsiveMasonry>
                  {this.state.items.map((nft) => {
                    return (
                      <div className={styles.cardContainer} key={nft.token}>
                          <div
                          onClick={() => this.updateSelected(nft.id)}
                          style={{ border: '2px solid black', position: 'relative' }}
                          key={nft.id}
                         >
                          <div className={styles.container} style={{ border: this.state.selected === nft.id && '3px solid black'}}>
                            {renderMediaType({
                              mimeType: nft.mime,
                              artifactUri: nft.artifact_uri,
                              displayUri: nft.display_uri,
                              displayView: true
                            })}
                          </div>
                        </div>
                        <div className={styles.cardContainer}>
                        <div className={`${styles.card} ${nft.mime=='audio/mpeg' && styles.audio}`}>
                       
                          <div className={styles.cardText}>
                            <div>OBJKT#{nft.id}</div>
                            <div className={styles.cardTitle}>{nft.title}</div>
                          </div>
                          <div className={styles.cardSelect}>
                            <Button onClick={() => nft.id === this.state.selected ? this.sendObjkt()
                               : this.updateSelected(nft.id)}>
                              <Purchase>
                                <div className={styles.cardSelectOption}>
                                {nft.id === this.state.selected ? 'send' :  'select'}
                                </div>
                              </Purchase>
                            </Button>
                          </div>
                       
                          </div>
                        </div>
                      </div>
    
                    )
                  })}
                </ResponsiveMasonry>
              </InfiniteScroll>
            </Container>
          </div>
        )}

        {/* TODO - someone really needs to clean up the other tabs :) */}
        {/* {this.state.collabsState && (
          <CollabsTab wallet={this.state.wallet} filter={this.state.filter} />
        )} */}

        {!this.state.loading && this.state.collectionState && (
          <div>
            <Container>
              <Padding>
                {this.state.filter && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        onClick={() => { this.collectionFull() }}>
                        <div className={styles.tag}>
                          all
                        </div>
                      </Button>
                      <Button onClick={() => { this.collectionForSale() }}>
                        <div className={styles.tag}>
                          for sale
                        </div>
                      </Button>
                      <Button onClick={() => { this.collectionNotForSale() }}>
                        <div className={styles.tag}>
                          not for sale
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </Padding>
            </Container>
            <Container>

                  

              <InfiniteScroll
                dataLength={this.state.items.length}
                next={this.loadMore}
                hasMore={this.state.hasMore}
                loader={undefined}
                endMessage={<p></p>}
              >
                <ResponsiveMasonry>
                  {this.state.items.map((nft) => {
                    return (
                      <div className={styles.cardContainer} key={nft.token.id}>
                      <div
                      onClick={() => this.updateSelected(nft.token.id)}
                      style={{ border: '2px solid black', position: 'relative' }}
                      key={nft.token.id}
                     >
                      <div className={styles.container} style={{ border: this.state.selected === nft.token.id && '3px solid black'}}>
                        {renderMediaType({
                          mimeType: nft.token.mime,
                          artifactUri: nft.token.artifact_uri,
                          displayUri: nft.token.display_uri,
                          displayView: true
                        })}
                      </div>
                    </div>
                    <div className={styles.cardContainer}>
                    <div className={`${styles.card} ${nft.token.mime=='audio/mpeg' && styles.audio}`}>
                   
                      <div className={styles.cardText}>
                        <div>OBJKT#{nft.token.id}</div>
                        <div className={styles.cardTitle}>{nft.token.title}</div>
                      </div>
                      <div className={styles.cardSelect}>
                        <Button onClick={() => nft.token.id === this.state.selected ? this.sendObjkt()
                           : this.updateSelected(nft.token.id)}>
                          <Purchase>
                            <div className={styles.cardSelectOption}>
                            {nft.token.id === this.state.selected ? 'send' :  'select'}
                            </div>
                          </Purchase>
                        </Button>
                      </div>
                   
                      </div>
                    </div>
                  </div>

                )
              })}
                </ResponsiveMasonry>
              </InfiniteScroll>
            </Container>
          </div>
        )}
      </Page>
    )
  }
}
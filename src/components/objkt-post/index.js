/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Button } from '../button'
import { PATH } from '../../constants'
import { Container, Padding } from '../layout'
import { Identicon } from '../identicons'
import { renderMediaType } from '../media-types'
import { ItemInfo } from '../item-info'

import styles from './styles.module.scss'
import './style.css'

export const ObjktPost = (item) => {
    const [objkt, setObjkt] = useState(JSON.parse(JSON.stringify(item.token ? item.token : item)))
    const [logo, setLogo] = useState()
    const axios = require('axios')

    useEffect(() => {
      const getMetadataFile = async () => {
        if (objkt.creator.metadata_file) {
          let meta = await axios.get('https://dweb.link/ipfs/' + objkt.creator.metadata_file.split('//')[1]).then(res => res.data)
          setLogo(meta.identicon) 
        }
      }
      getMetadataFile()
    }, [])

  return (
    <> 
      <br/>
      <div
        style={{
          position: 'relative',
          display: 'block',
          width: '100%'
        }}
        className="objkt-display">
          <Button to={objkt.creator.name ? `/${objkt.creator.name}` : `${PATH.ISSUER}/${objkt.creator.address}`}>
            <Identicon address={objkt.creator.address} logo={logo} feed={true}/><br/>
          </Button>
        <div className={
          objkt.mime === 'application/x-directory' || objkt.mime === 'image/svg+xml' ? 'objktview-zipembed objktview ' + styles.objktview :
            [(
              objkt.mime === 'video/mp4' ||
                objkt.mime === 'video/ogv' ||
                objkt.mime === 'video/quicktime' ||
                objkt.mime === 'video/webm' ||
                objkt.mime === 'application/pdf' ? 'no-fullscreen' : 'objktview ' + styles.objktview
            )]
        }>
          <Button to={`${PATH.OBJKT}/${objkt.id}`}>
            {renderMediaType({
              mimeType: objkt.mime,
              artifactUri: objkt.artifact_uri,
              displayUri: objkt.display_uri,
              creator: objkt.creator,
              objkt: objkt.id,
              interactive: false,
              displayView: true
            })}
          </Button>
        </div>
        <div>
          <Container>
            <Padding>
              <ItemInfo {...objkt} isDetailView post />
            </Padding>
          </Container>
          <Container>
            <Padding>
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}
              >
                {objkt.title}
              </div>
            </Padding>
          </Container>
          <Container>
            <Padding>
              <div style={{ whiteSpace: 'pre-wrap' }}>{objkt.description}</div>
            </Padding>
          </Container>
          <Container>
            <Padding>{objkt.royalties/ 10}% royalties</Padding>
            {/* <Padding>timestamp: {objkt.timestamp}</Padding> */}<br/>
            <Padding>mimetype: {objkt.mime}</Padding>
          </Container>
        </div>
        <Container>
          <div style={{ borderBottom: '1px solid var(--text-color)', opacity: '39%'}}></div>
        </Container>
      </div>
    </>
  )
}

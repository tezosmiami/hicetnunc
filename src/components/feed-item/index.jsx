import React from 'react'
import { PATH } from '../../constants'
import { Padding } from '../layout'
import { Button } from '../button'
import { ItemInfo } from '../item-info'
import { renderMediaType } from '../media-types'
import { VisuallyHidden } from '../visually-hidden'
import styles from './styles.module.scss'

export const FeedItem = (props) => {
  return (
    <div className={styles.container} style={{overflowX: 'hidden'}}>
    <Padding>
      <Button to={`${PATH.OBJKT}/${props.id}`}>
        <VisuallyHidden>{`Go to OBJKT: ${props.title}`}</VisuallyHidden>
        <div className={styles.container}>
          {renderMediaType({
            mimeType: props.mime || props.token.mime || '',
            artifactUri: props.artifact_uri || props.token?.artifact_uri || '',
            displayUri: props.display_uri || props.token?.display_uri || '',
            creator: props.creator_id || props.token?.creator_id || '',
            objkt: String(props.id) || '',
            displayView: true
          })}
        </div>
      </Button>
      <div style={{ paddingLeft: '15px', paddingRight: '15px' }}>
        <ItemInfo {...props} />
      </div>
    </Padding>
    </div>
  )
}

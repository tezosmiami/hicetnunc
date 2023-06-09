import React from 'react'
import styles from './styles.module.scss'
// import axios from 'axios'

export const UnknownComponent = ({ mimeType }) => {
/*   const [queue, updateQueue] = useState()
  updateQueue(await axios.post(import.meta.env.VITE_GRAPHQL_STATUS).then(res => res.data))
 */
  return (
    <div className={styles.container}>
      <div className={styles.square}>Metadata on queue</div>
    </div>
  )
}

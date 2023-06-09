import React from 'react'
import { Helmet } from 'react-helmet'
import classnames from 'classnames'
import { VisuallyHidden } from '../../visually-hidden'
import styles from './styles.module.scss'

export const Page = ({ title = 'H=N', children = null, large, feed, fixed}) => {
  const classes = classnames({
    [styles.container]: true,
    [styles.large]: large,
    [styles.feed]: feed,
    [styles.fixed]: fixed
  })
  return (
    <main className={classes}>
      <Helmet>
        {title !== '' ? (
          <title>{title} - hic et nunc - magic city</title>
        ) : (
          <title>hic et nunc - magic city</title>
        )}
      </Helmet>
      <VisuallyHidden as="h1">{title}</VisuallyHidden>
      {children}
    </main>
  )
}

import Sync from './pages/sync'
import { About } from './pages/about'
import { FAQ } from './pages/faq'
import Display from './pages/display'
import { Latest, Hdao, Random, Featured } from './pages/feeds'
import { Mint } from './pages/mint'
import { Live } from './pages/live'
import { Messages } from './pages/messages'
import { ObjktDisplay } from './pages/objkt-display'
import { Collaborate, CollabDisplay } from './pages/collaborate'
import { Galleries } from './pages/galleries'
import { GalleryDetail } from './pages/gallery-detail'
import { Config } from './pages/config'
import { Search } from './pages/search'
import { Tags } from './pages/tags'
import { Friends } from './pages/friends'
import { Gaming } from './pages/gaming'


export const routes = [
  {
    exact: true,
    path: '/',
    component: Search,
  },
  {
    exact: false,
    path: '/hdao',
    component: Hdao,
  },
  {
    exact: false,
    path: '/random',
    component: Random,
  },
  {
    exact: false,
    path: '/latest',
    component: Latest,
  },
  // {
  //   exact: false,
  //   path: '/friends/:id',
  //   component: Friends,
  // },
  {
    exact: false,
    path: '/gaming',
    component: Gaming,
  },
  {
    exact: false,
    path: '/tz/:id/:collection?',
    component: Display,
  },
  {
    exact: false,
    path: '/kt/:id',
    component: CollabDisplay,
  },
  {
    exact: false,
    path: '/collab/:name',
    component: CollabDisplay,
  },
  {
    exact: false,
    path: '/about',
    component: About,
  },
  {
    exact: false,
    path: '/faq',
    component: FAQ,
  },
  {
    exact: false,
    path: '/sync',
    component: Sync,
  },
  {
    exact: false,
    path: '/mint',
    component: Mint,
  },
  {
    exact: false,
    path: '/live',
    component: Live,
  },
  {
    exact: false,
    path: '/:id/live',
    component: Live,
  },
  {
    exact: false,
    path: '/chat',
    component: Live,
  },
  {
    exact: false,
    path: '/lobby',
    component: Live,
  },
  {
    exact: false,
    path: '/messages',
    component: Messages,
  },
  {
    exact: false,
    path: '/:id/messages',
    component: Messages,
  },
  {
    exact: false,
    path: '/collaborate/:action?',
    component: Collaborate,
  },
  {
    exact: false,
    path: '/objkt/:id',
    component: ObjktDisplay,
  },
  {
    exact: false,
    path: '/galleries',
    component: Galleries,
  },
  {
    exact: false,
    path: '/gallery/:id',
    component: GalleryDetail,
  },

  //
  //add condition for verifying if user is synced
  ///////////////
  {
    exact: false,
    path: '/config',
    component: Config,
  },
  {
    exact: false,
    path: '/search',
    component: Search,
  },
  {
    exact: false,
    path: '/tags/:id',
    component: Tags,
  },
  {
    exact: false,
    path: '/friends/:id',
    component: Friends,
  },
  {
    exact: false,
    path: '/:id/:collection?',
    component: Display,
  }
]

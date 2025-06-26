import { sdk } from './sdk'
import { uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, 'ui-multi')
  const uiMultiOrigin = await uiMulti.bindPort(uiPort, {
    protocol: 'http',
  })
  const ui = sdk.createInterface(effects, {
    name: 'Web UI',
    id: 'ui',
    description: 'The web interface of Nextcloud',
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  // webdav
  const webdav = sdk.createInterface(effects, {
    name: 'WebDAV',
    id: 'webdav',
    description: 'Addresses for WebDAV syncing',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '/remote.php/dav/',
    query: {},
  })

  const uiReceipt = await uiMultiOrigin.export([ui, webdav])

  return [uiReceipt]
})

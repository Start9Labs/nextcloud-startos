import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, 'main')
  const uiMultiOrigin = await uiMulti.bindPort(uiPort, {
    protocol: 'http',
    addSsl: { addXForwardedHeaders: true },
  })
  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: 'ui',
    description: i18n('The web interface of Nextcloud'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  // webdav
  const webdav = sdk.createInterface(effects, {
    name: i18n('WebDAV'),
    id: 'webdav',
    description: i18n('Addresses for WebDAV syncing'),
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

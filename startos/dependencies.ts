import { T } from '@start9labs/start-sdk'
import { ExternalStorageSource, externalStorageMeta } from './externalStorage'
import { storeJson } from './fileModels/store.json'
import {
  collaboraDescription,
  coturnDescription,
  filebrowserDescription,
  nextexplorerDescription,
  onlyofficeDescription,
} from './manifest/i18n'
import { OfficeSuite, officeSuiteMeta } from './officeSuite'
import { sdk } from './sdk'
import { coturnId, coturnVersionRange } from './utils'

// Required only while selected. `exists`, not `running`: Nextcloud needs the
// source's volume on disk to mount, not the service itself.
const externalSource =
  (id: ExternalStorageSource) =>
  async ({ effects }: { effects: T.Effects }) =>
    (
      (await storeJson.read((s) => s.externalStorages).const(effects)) ?? []
    ).includes(id)

// The document server has to be up before Nextcloud can hand it a document,
// and its own health check is the readiness signal.
const officeSuite =
  (suite: OfficeSuite) =>
  async ({ effects }: { effects: T.Effects }) =>
    (await storeJson.read((s) => s.officeSuite).const(effects)) === suite

export const dependencies = sdk.Dependencies.of()
  .addDependency(
    sdk.Dependency.optional('nextexplorer', {
      description: nextexplorerDescription,
      metadata: {
        title: 'NextExplorer',
        icon: 'https://raw.githubusercontent.com/Start9Labs/nextexplorer-startos/04f7ecbfc31ad2205e0222dd7568fb881aa06c79/icon.svg',
      },
      versionRange: externalStorageMeta.nextexplorer.versionRange,
      kind: 'exists',
      enabled: externalSource('nextexplorer'),
    }),
  )
  .addDependency(
    sdk.Dependency.optional('filebrowser', {
      description: filebrowserDescription,
      metadata: {
        title: 'FileBrowser Quantum',
        icon: 'https://raw.githubusercontent.com/Start9Labs/filebrowser-quantum-startos/e936a6c85a97b930b43cad5e9c0dd4898a2df567/icon.svg',
      },
      versionRange: externalStorageMeta.filebrowser.versionRange,
      kind: 'exists',
      enabled: externalSource('filebrowser'),
    }),
  )
  .addDependency(
    // Only while the user has asked Talk to use it. No healthChecks: Coturn's
    // own `TURN Server` check fails until a public domain is attached to it,
    // which would surface here as a permanently unmet dependency even though
    // Talk falls back to direct connections.
    sdk.Dependency.optional(coturnId, {
      description: coturnDescription,
      metadata: {
        title: 'Coturn',
        icon: 'https://raw.githubusercontent.com/Start9Labs/coturn-startos/d67ecaca5800a87e3300ce44c62484888f35d51b/icon.svg',
      },
      versionRange: coturnVersionRange,
      kind: 'running',
      healthChecks: [],
      enabled: async ({ effects }) =>
        (await storeJson.read((s) => s.talkTurn).const(effects)) ?? false,
    }),
  )
  .addDependency(
    sdk.Dependency.optional(officeSuiteMeta.collabora.packageId, {
      description: collaboraDescription,
      metadata: {
        title: 'Collabora Online',
        icon: 'https://raw.githubusercontent.com/Start9Labs/collabora-online-startos/f03b9c67c185bf63d55b5e6f28e6e85a46c65fcb/icon.png',
      },
      versionRange: officeSuiteMeta.collabora.versionRange,
      kind: 'running',
      healthChecks: [officeSuiteMeta.collabora.healthCheckId],
      enabled: officeSuite('collabora'),
    }),
  )
  .addDependency(
    sdk.Dependency.optional(officeSuiteMeta.onlyoffice.packageId, {
      description: onlyofficeDescription,
      metadata: {
        title: 'ONLYOFFICE Docs',
        icon: 'https://raw.githubusercontent.com/Start9-Community/onlyoffice-docs-startos/fa723dfd81ec7aae30d1b29520daff139427b3e4/icon.png',
      },
      versionRange: officeSuiteMeta.onlyoffice.versionRange,
      kind: 'running',
      healthChecks: [officeSuiteMeta.onlyoffice.healthCheckId],
      enabled: officeSuite('onlyoffice'),
    }),
  )

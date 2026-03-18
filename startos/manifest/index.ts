import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'nextcloud',
  title: 'Nextcloud',
  license: 'gpl',
  packageRepo:
    'https://github.com/Start9Labs/nextcloud-startos/tree/update/040',
  upstreamRepo: 'https://github.com/nextcloud/docker',
  marketingUrl: 'https://nextcloud.com/',
  docsUrls: [
    'https://docs.nextcloud.com/server/latest/admin_manual/',
    'https://docs.nextcloud.com/server/latest/user_manual/en/',
  ],
  donationUrl: null,
  description: { short, long },
  volumes: ['main', 'nextcloud', 'db'],
  images: {
    postgres: {
      source: {
        dockerTag: 'postgres:17-alpine',
      },
      arch: ['x86_64', 'aarch64'],
    },
    nextcloud: {
      source: {
        dockerTag: 'nextcloud:32.0.6-apache',
      },
      arch: ['x86_64', 'aarch64'],
    },
    valkey: {
      source: {
        dockerTag: 'valkey/valkey:9-alpine',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})

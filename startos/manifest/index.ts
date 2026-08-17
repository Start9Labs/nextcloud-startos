import { setupManifest } from '@start9labs/start-sdk'
import { coturnDescription, filebrowserDescription, long, short } from './i18n'

export const manifest = setupManifest({
  id: 'nextcloud',
  title: 'Nextcloud',
  license: 'gpl',
  packageRepo: 'https://github.com/Start9Labs/nextcloud-startos',
  upstreamRepo: 'https://github.com/nextcloud/docker',
  marketingUrl: 'https://nextcloud.com/',
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
        dockerBuild: {
          dockerfile: './nextcloud.Dockerfile',
        },
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
  dependencies: {
    filebrowser: {
      description: filebrowserDescription,
      optional: true,
      metadata: {
        title: 'File Browser',
        icon: 'https://raw.githubusercontent.com/Start9Labs/filebrowser-startos/fbf1fefb51cca9731f2a9a9e6f790ca150aa9d04/icon.svg',
      },
    },
    coturn: {
      description: coturnDescription,
      optional: true,
      metadata: {
        title: 'Coturn',
        icon: 'https://raw.githubusercontent.com/Start9Labs/coturn-startos/d67ecaca5800a87e3300ce44c62484888f35d51b/icon.svg',
      },
    },
  },
})

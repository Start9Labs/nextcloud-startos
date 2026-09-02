import { setupManifest } from '@start9labs/start-sdk'
import {
  collaboraDescription,
  coturnDescription,
  filebrowserDescription,
  long,
  onlyofficeDescription,
  short,
} from './i18n'

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
    'collabora-online': {
      description: collaboraDescription,
      optional: true,
      metadata: {
        title: 'Collabora Online',
        icon: 'https://raw.githubusercontent.com/Start9Labs/collabora-online-startos/f03b9c67c185bf63d55b5e6f28e6e85a46c65fcb/icon.png',
      },
    },
    'onlyoffice-docs': {
      description: onlyofficeDescription,
      optional: true,
      metadata: {
        title: 'ONLYOFFICE Docs',
        icon: 'https://raw.githubusercontent.com/Start9-Community/onlyoffice-docs-startos/fa723dfd81ec7aae30d1b29520daff139427b3e4/icon.png',
      },
    },
  },
})

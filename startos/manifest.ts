import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'nextcloud',
  title: 'Nextcloud',
  license: 'gpl',
  wrapperRepo: 'https://github.com/Start9Labs/nextcloud-startos',
  upstreamRepo: 'https://github.com/nextcloud/docker',
  supportSite: 'https://github.com/nextcloud/docker/issues',
  marketingSite: 'https://nextcloud.com',
  donationUrl: null,
  description: {
    short: 'A safe home for all your data',
    long: 'Access & share your files, calendars, contacts, mail & more from any device, on your terms.',
  },
  volumes: ['main', 'nextcloud', 'db'],
  images: {
    nextcloud: {
      source: {
        dockerBuild: {},
      },
    },
  },
  hardwareRequirements: {},
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

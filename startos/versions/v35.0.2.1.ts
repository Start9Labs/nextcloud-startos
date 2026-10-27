import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'node:fs/promises'
import { sdk } from '../sdk'

export const v_35_0_2_1 = VersionInfo.of({
  version: '35.0.2:1',
  releaseNotes: {
    en_US:
      'Updates PHP to fix two critical remote code execution vulnerabilities (PHP2Shell, CVE-2026-109618 and CVE-2026-109619). Also stops trusting certificates from a compromised certificate authority (eMudhra).',
    es_ES:
      'Actualiza PHP para corregir dos vulnerabilidades críticas de ejecución remota de código (PHP2Shell, CVE-2026-109618 y CVE-2026-109619). También deja de confiar en los certificados de una autoridad de certificación comprometida (eMudhra).',
    de_DE:
      'Aktualisiert PHP und behebt zwei kritische Sicherheitslücken zur Remotecodeausführung (PHP2Shell, CVE-2026-109618 und CVE-2026-109619). Vertraut außerdem Zertifikaten einer kompromittierten Zertifizierungsstelle (eMudhra) nicht mehr.',
    pl_PL:
      'Aktualizuje PHP, usuwając dwie krytyczne luki umożliwiające zdalne wykonanie kodu (PHP2Shell, CVE-2026-109618 i CVE-2026-109619). Przestaje też ufać certyfikatom przejętego urzędu certyfikacji (eMudhra).',
    fr_FR: `Met à jour PHP pour corriger deux vulnérabilités critiques d'exécution de code à distance (PHP2Shell, CVE-2026-109618 et CVE-2026-109619). Ne fait plus confiance non plus aux certificats d'une autorité de certification compromise (eMudhra).`,
  },
  migrations: {
    up: async () => {
      // Nextcloud reuses this cached bundle until the default bundle's mtime is newer than it.
      await rm(
        sdk.volumes.nextcloud.subpath('data/files_external/rootcerts.crt'),
        { force: true },
      )
    },
    down: IMPOSSIBLE,
  },
})

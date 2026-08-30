# Security Policy

## Sicherheitslücke melden

Bitte melde Sicherheitslücken **nicht** über öffentliche GitHub-Issues.

Schreibe stattdessen an **hi@ugc-vz.de** mit:

- Beschreibung der Lücke und betroffene URL/Route
- Schritte zur Reproduktion
- Mögliche Auswirkung (z. B. Datenzugriff, Rechteausweitung)

Wir bestätigen den Eingang innerhalb von 72 Stunden und halten dich über die
Behebung auf dem Laufenden. Bitte gib uns angemessene Zeit zur Behebung, bevor
du Details veröffentlichst.

## Scope

- https://ugc-vz.de (Website, REST API v1, MCP-Endpunkt `/api/mcp`)
- npm-Paket [`ugc-vz-mcp`](https://www.npmjs.com/package/ugc-vz-mcp)

Rate-Limit-Tests bitte nur mit minimaler Last; Denial-of-Service-Tests sind
nicht gestattet.

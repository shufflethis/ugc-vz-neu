/**
 * Einzige Quelle fuer die Version des Agent-Layers.
 *
 * Dieselbe Zahl stand vorher dreimal hart im Code (MCP-serverInfo,
 * Discovery-Manifest, A2A-Agent-Card) und ist erwartungsgemaess
 * auseinandergelaufen: waehrend npm auf 1.0.1 und der Registry-Eintrag auf
 * 1.0.2 standen, meldete der Handshake weiterhin 1.0.0 -- aufgefallen erst im
 * Deployment-Log eines fremden Portals ("Server info retrieved. name: ugc-vz,
 * version: 1.0.0").
 *
 * Beim Anheben mitziehen: `version` in der server.json des MCP-Repos
 * (github.com/ugcvz/ugc-vz-mcp) und der Registry-Publish. Die npm-Version der
 * Bruecke darf abweichen -- die aendert sich nur, wenn sich die Bruecke selbst
 * aendert.
 */
export const AGENT_LAYER_VERSION = '1.0.2';

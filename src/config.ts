// ─────────────────────────────────────────────
// Dropdown の並び順とデフォルト値の設定
// ─────────────────────────────────────────────
// ここに列挙した項目が上位に表示される（記載順）。
// 未列挙の項目はその後にアルファベット順で表示される。

/** Hostname の並び順（上位に出したい順） */
export const PREFERRED_HOSTNAMES = [
  "github.com",
  "ikedaosushi-github.com",
  "ini.backlog.jp",
];

/** Org / Owner の並び順（Hostname ごと、上位に出したい順） */
export const PREFERRED_ORGS: Record<string, string[]> = {
  "github.com": ["ramencloud"],
  "ikedaosushi-github.com": ["ikedaosushi", "ini-inc", "mysource-inc"],
  "ini.backlog.jp": ["avio", "orbis"],
};

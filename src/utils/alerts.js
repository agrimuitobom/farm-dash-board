// アラートの表記ゆれをそろえる
//
// 以前のサンプルデータは severity が「警告」「注意」、status が無く、本文が message に入っている。
// 画面側は severity を high / medium / low、status を pending / in-progress / resolved で扱う。

const SEVERITY_ALIASES = {
  '警告': 'high',
  '注意': 'medium',
  '情報': 'low'
};

export const normalizeAlert = (alert) => ({
  ...alert,
  severity: SEVERITY_ALIASES[alert.severity] || alert.severity || 'medium',
  status: alert.status || (alert.resolved ? 'resolved' : 'pending'),
  description: alert.description || alert.message || '',
  houseName: alert.houseName || alert.houseId || ''
});

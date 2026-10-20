// 作業（タスク）の表記ゆれをそろえる
//
// 以前のサンプルデータは priority が「高」「中」「低」、status が無く completed だけを持つ。
// 画面から追加した作業は priority が high / medium / low、status が pending / in-progress / completed。
// 読み込み時にどちらも後者の形にそろえる（編集画面の選択肢と一致させるため）。

const PRIORITY_ALIASES = { '高': 'high', '中': 'medium', '低': 'low' };

export const PRIORITY_LABELS = { high: '高', medium: '中', low: '低' };
export const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };

export const PRIORITY_CLASSES = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};

export const normalizeTask = (task) => {
  let dueDate = null;
  if (task.dueDate instanceof Date) {
    dueDate = task.dueDate;
  } else if (task.dueDate) {
    dueDate = new Date(task.dueDate);
  }
  return {
    ...task,
    title: task.title || '（無題）',
    description: task.description || '',
    assignedTo: task.assignedTo || '',
    priority: PRIORITY_ALIASES[task.priority] || task.priority || 'medium',
    status: task.status || (task.completed ? 'completed' : 'pending'),
    dueDate
  };
};

export const isTaskDone = (task) => task.status === 'completed';

// 画面で編集した作業を Firestore に保存する形にする（id は保存しない。completed は status に合わせる）
export const toTaskUpdate = (task) => {
  const { id, ...rest } = task;
  return { ...rest, completed: rest.status === 'completed' };
};

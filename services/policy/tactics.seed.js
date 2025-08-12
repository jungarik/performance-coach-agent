export const SEED_TACTICS = [
  { key: 'focus_sprint', prompt: 'Commit to a 25-min focus sprint on your #1 task.', tool: 'schedule_nudge', args:{time:'+30m', msg:'Finish sprint?'} },
  { key: 'if_then_plan', prompt: 'Create an IF–THEN plan: "If X distraction appears, then I will Y."', tool:'log_note' },
  { key: 'break_goal', prompt: 'Break goal into 3 outcome steps for today.', tool:'plan_day' },
  { key: 'reflect_why', prompt: '1 sentence: Why does this goal matter *today*?', tool:'log_note' },
  { key: 'temptation_bundling', prompt: 'Pair your task with a small reward you enjoy.', tool:'log_note' },
];
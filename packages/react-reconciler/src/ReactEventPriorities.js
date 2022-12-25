/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Lane, Lanes } from './ReactFiberLane';

import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork,
} from './ReactFiberLane';

export opaque type EventPriority = Lane;

export const DiscreteEventPriority: EventPriority = SyncLane; // 事件优先级中的最高优先级
export const ContinuousEventPriority: EventPriority = InputContinuousLane;
export const DefaultEventPriority: EventPriority = DefaultLane;
export const IdleEventPriority: EventPriority = IdleLane;

let currentUpdatePriority: EventPriority = NoLane;

export function getCurrentUpdatePriority(): EventPriority {
  return currentUpdatePriority;
}

export function setCurrentUpdatePriority(newPriority: EventPriority) {
  currentUpdatePriority = newPriority;
}

export function runWithPriority<T>(priority: EventPriority, fn: () => T): T {
  const previousPriority = currentUpdatePriority;
  try {
    currentUpdatePriority = priority;
    return fn();
  } finally {
    currentUpdatePriority = previousPriority;
  }
}

export function higherEventPriority(
  a: EventPriority,
  b: EventPriority,
): EventPriority {
  return a !== 0 && a < b ? a : b;
}

export function lowerEventPriority(
  a: EventPriority,
  b: EventPriority,
): EventPriority {
  return a === 0 || a > b ? a : b;
}

export function isHigherEventPriority( // a的优先级是否高于b
  a: EventPriority,
  b: EventPriority,
): boolean {
  return a !== 0 && a < b;
}

export function lanesToEventPriority(lanes: Lanes): EventPriority {// 将lane转换为事件优先级
  const lane = getHighestPriorityLane(lanes);
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) { // 如果lane比DiscreteEventPriority的优先级还高返回DiscreteEventPriority
    return DiscreteEventPriority;
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) { // 比ContinuousEventPriority高返回ContinuousEventPriority
    return ContinuousEventPriority;
  }
  if (includesNonIdleWork(lane)) { // 否则包含NonIdleLanes返回DefaultEventPriority
    return DefaultEventPriority;
  }
  return IdleEventPriority; // 全部都是IdleLanes返回优先级最低的IdleEventPriority
}

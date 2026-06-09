// src/hooks/useBucketList.ts
// 버킷리스트 상태 관리 훅

import { useState } from 'react';
import type { BucketItem, Category } from '../data/bucketList';
import { initialBucketList } from '../data/bucketList';

export function useBucketList() {
  const [items, setItems] = useState<BucketItem[]>(initialBucketList);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const toggleDone = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              done: !item.done,
              completedAt: !item.done
                ? new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
                : null,
            }
          : item
      )
    );
  };

  const addItem = (title: string, category: Category) => {
    const newItem: BucketItem = {
      id: Date.now(),
      title,
      category,
      done: false,
      completedAt: null,
      lat: null,
      lng: null,
      memo: '',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const deleteItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateMemo = (id: number, memo: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, memo } : item))
    );
  };

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;

  const stats = {
    total: items.length,
    done: items.filter((i) => i.done).length,
    percent: Math.round((items.filter((i) => i.done).length / items.length) * 100),
  };

  return {
    items,
    selectedId,
    selectedItem,
    stats,
    setSelectedId,
    toggleDone,
    addItem,
    deleteItem,
    updateMemo,
  };
}

/**
 * Favorites Store - Manages Quick Access favorites.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Favorite } from '../types';
import { getFavorites, addFavorite, removeFavorite, reorderFavorites } from '../shared/ipc';

export const useFavoritesStore = defineStore('favorites', () => {
  // State
  const favorites = ref<Favorite[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const sortedFavorites = computed(() => {
    return [...favorites.value].sort((a, b) => a.order - b.order);
  });

  // Actions
  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      favorites.value = await getFavorites();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load favorites';
    } finally {
      loading.value = false;
    }
  }

  async function add(name: string, path: string, icon?: string): Promise<boolean> {
    try {
      const favorite = await addFavorite(name, path, icon);
      favorites.value.push(favorite);
      return true;
    } catch (_error) {
      return false;
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      const success = await removeFavorite(id);
      if (success) {
        favorites.value = favorites.value.filter((f) => f.id !== id);
      }
      return success;
    } catch (_error) {
      return false;
    }
  }

  async function reorder(ids: string[]): Promise<boolean> {
    try {
      await reorderFavorites(ids);
      // Reorder local state
      const orderMap = new Map(ids.map((id, index) => [id, index]));
      favorites.value.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function isFavorite(path: string): boolean {
    return favorites.value.some((f) => f.path === path);
  }

  async function toggle(name: string, path: string, type: 'folder' | 'file'): Promise<boolean> {
    const existing = favorites.value.find((f) => f.path === path);
    if (existing) {
      return remove(existing.id);
    } else {
      return add(name, path, type === 'folder' ? 'folder' : 'file');
    }
  }

  return {
    // State
    favorites,
    loading,
    error,
    // Computed
    sortedFavorites,
    // Actions
    load,
    add,
    remove,
    reorder,
    isFavorite,
    toggle,
  };
});

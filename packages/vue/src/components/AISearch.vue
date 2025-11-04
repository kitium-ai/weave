<template>
  <div class="weave-search">
    <form class="weave-search__form" @submit.prevent="handleSearch">
      <input
        v-model="searchQuery"
        :placeholder="placeholder"
        class="weave-search__input"
        type="search"
        :disabled="isLoading"
      />
      <button type="submit" class="weave-search__button" :disabled="!searchQuery || isLoading">
        {{ isLoading ? 'Searching...' : 'Search' }}
      </button>
    </form>

    <div v-if="results && results.length" class="weave-search__results">
      <div
        v-for="result in results"
        :key="result.id"
        class="weave-search__result-item"
        @click="selectResult(result)"
      >
        <div class="weave-search__result-title">{{ result.title }}</div>
        <p class="weave-search__result-description">{{ result.description }}</p>
        <div v-if="showScore && result.score !== undefined" class="weave-search__result-score">
          Relevance: {{ (result.score * 100).toFixed(0) }}%
        </div>
      </div>
    </div>

    <div v-else-if="hasSearched && !results?.length" class="weave-search__no-results">
      No results found for "{{ searchQuery }}"
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { AISearchProps } from '../types/components';

const props = withDefaults(defineProps<AISearchProps>(), {
  placeholder: 'Search...',
  showScore: true,
  isLoading: false,
  results: () => [],
});

const emit = defineEmits<{
  search: [query: string];
  selectResult: [result: any];
}>();

const searchQuery = ref('');
const isLoading = ref(props.isLoading);
const hasSearched = ref(false);

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return;

  hasSearched.value = true;
  isLoading.value = true;

  try {
    emit('search', searchQuery.value);
    if (props.onSearch) {
      await props.onSearch(searchQuery.value);
    }
  } catch (error) {
    logError('Search error:', error);
  } finally {
    isLoading.value = false;
  }
};

const selectResult = (result: any) => {
  emit('selectResult', result);
};
</script>

<style scoped>
.weave-search {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weave-search__form {
  display: flex;
  gap: 8px;
}

.weave-search__input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.weave-search__input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

@media (prefers-color-scheme: dark) {
  .weave-search__input {
    background-color: #333;
    border-color: #555;
    color: #fff;
  }

  .weave-search__input:focus {
    border-color: #0056b3;
  }
}

.weave-search__button {
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.weave-search__button:hover:not(:disabled) {
  background-color: #0056b3;
}

.weave-search__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.weave-search__results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weave-search__result-item {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.weave-search__result-item:hover {
  background-color: #f9f9f9;
  border-color: #007bff;
}

@media (prefers-color-scheme: dark) {
  .weave-search__result-item {
    border-color: #444;
  }

  .weave-search__result-item:hover {
    background-color: #252525;
    border-color: #0056b3;
  }
}

.weave-search__result-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

@media (prefers-color-scheme: dark) {
  .weave-search__result-title {
    color: #fff;
  }
}

.weave-search__result-description {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

@media (prefers-color-scheme: dark) {
  .weave-search__result-description {
    color: #aaa;
  }
}

.weave-search__result-score {
  font-size: 12px;
  color: #999;
}

.weave-search__no-results {
  padding: 24px;
  text-align: center;
  color: #999;
}

@media (prefers-color-scheme: dark) {
  .weave-search__no-results {
    color: #666;
  }
}
</style>

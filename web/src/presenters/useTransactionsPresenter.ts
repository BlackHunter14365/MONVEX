"use client";

/**
 * [P] PRESENTER: Transactions Feature ViewModel
 * Encapsulates search, filtering, pagination, and CRUD mutation flows.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { Transaction, CreateTransactionPayload } from '@/models';

export interface TransactionsState {
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  totalCount: number;
  searchQuery: string;
  selectedCategory: string;
  selectedType: string;
  isAddModalOpen: boolean;
}

export function useTransactionsPresenter() {
  const [state, setState] = useState<TransactionsState>({
    isLoading: true,
    isMutating: false,
    error: null,
    transactions: [],
    filteredTransactions: [],
    totalCount: 0,
    searchQuery: '',
    selectedCategory: 'ALL',
    selectedType: 'ALL',
    isAddModalOpen: false,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const res = await api.getTransactions({ limit: 100 });
      const items = (res as any)?.results || (Array.isArray(res) ? res : []);
      setState(prev => ({
        ...prev,
        isLoading: false,
        transactions: items,
        totalCount: (res as any)?.count || items.length,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to load transactions',
      }));
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = useMemo(() => {
    return state.transactions.filter(t => {
      const matchSearch = !state.searchQuery || 
        t.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (t.category_name || t.category || '').toLowerCase().includes(state.searchQuery.toLowerCase());
      
      const matchCat = state.selectedCategory === 'ALL' || 
        (t.category_name || t.category) === state.selectedCategory;
      
      const matchType = state.selectedType === 'ALL' || 
        t.type.toUpperCase() === state.selectedType.toUpperCase();

      return matchSearch && matchCat && matchType;
    });
  }, [state.transactions, state.searchQuery, state.selectedCategory, state.selectedType]);

  const createTransaction = useCallback(async (payload: CreateTransactionPayload) => {
    try {
      setState(prev => ({ ...prev, isMutating: true }));
      await api.createTransaction(payload);
      await fetchTransactions();
      setState(prev => ({ ...prev, isMutating: false, isAddModalOpen: false }));
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isMutating: false }));
      return { success: false, error: err?.message || 'Failed to create transaction' };
    }
  }, [fetchTransactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isMutating: true }));
      await api.deleteTransaction(id);
      await fetchTransactions();
      setState(prev => ({ ...prev, isMutating: false }));
      return { success: true };
    } catch (err: any) {
      setState(prev => ({ ...prev, isMutating: false }));
      return { success: false, error: err?.message || 'Failed to delete transaction' };
    }
  }, [fetchTransactions]);

  return {
    state: {
      ...state,
      filteredTransactions: filtered,
    },
    actions: {
      setSearchQuery: (query: string) => setState(prev => ({ ...prev, searchQuery: query })),
      setSelectedCategory: (cat: string) => setState(prev => ({ ...prev, selectedCategory: cat })),
      setSelectedType: (type: string) => setState(prev => ({ ...prev, selectedType: type })),
      openAddModal: () => setState(prev => ({ ...prev, isAddModalOpen: true })),
      closeAddModal: () => setState(prev => ({ ...prev, isAddModalOpen: false })),
      createTransaction,
      deleteTransaction,
      refresh: fetchTransactions,
    },
  };
}

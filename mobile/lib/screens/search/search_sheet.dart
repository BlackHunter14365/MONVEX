import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/search_provider.dart';

class SearchSheet extends StatefulWidget {
  const SearchSheet({super.key});

  @override
  State<SearchSheet> createState() => _SearchSheetState();
}

class _SearchSheetState extends State<SearchSheet> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  IconData _getCategoryIcon(String cat) {
    switch (cat.toUpperCase()) {
      case 'TRANSACTION':
        return Icons.receipt_long;
      case 'ACCOUNT':
        return Icons.account_balance;
      case 'BUDGET':
        return Icons.pie_chart_outline;
      case 'GOAL':
        return Icons.track_changes;
      case 'NAVIGATION':
      default:
        return Icons.explore_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final searchProvider = context.watch<SearchProvider>();
    final results = searchProvider.results;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        children: [
          // Handle
          Center(
            child: Container(
              height: 4,
              width: 36,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Search Field
          TextField(
            controller: _searchController,
            autofocus: true,
            onChanged: (val) => searchProvider.search(val),
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Search transactions, accounts, budgets...',
              prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18, color: AppColors.textMuted),
                      onPressed: () {
                        _searchController.clear();
                        searchProvider.clearSearch();
                      },
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 12),

          // Results List
          Expanded(
            child: searchProvider.isSearching
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : results.isEmpty
                    ? Center(
                        child: Text(
                          _searchController.text.isEmpty
                              ? 'Type to search across the entire MONVEX workspace'
                              : 'No results matching "${_searchController.text}"',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                        ),
                      )
                    : ListView.builder(
                        itemCount: results.length,
                        itemBuilder: (context, index) {
                          final item = results[index];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceElevated,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: ListTile(
                              leading: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(_getCategoryIcon(item.category), size: 20, color: AppColors.primaryLight),
                              ),
                              title: Text(
                                item.title,
                                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700),
                              ),
                              subtitle: Text(
                                '${item.category} • ${item.subtitle}',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                              ),
                              onTap: () {
                                Navigator.pop(context);
                              },
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

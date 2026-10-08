package com.mca.myapplication

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.mca.myapplication.data.HomeOverview
import com.mca.myapplication.data.HomeRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.isActive

enum class HomeTab { TODAY, MEAL_LOG, SOS, IDEAS, INSIGHT, PROFILE }

data class HomeUiState(
    val overview: HomeOverview = HomeOverview(),
    val selectedTab: HomeTab = HomeTab.TODAY,
    val nowMillis: Long = System.currentTimeMillis(),
    val loading: Boolean = true,
    val error: Boolean = false,
    val showDraftChoice: Boolean = false,
)

class HomeViewModel(private val repository: HomeRepository) : ViewModel() {
    private val mutable = MutableStateFlow(HomeUiState())
    val state = mutable.asStateFlow()
    private var loadJob: Job? = null

    fun refresh() {
        loadJob?.cancel()
        mutable.value = mutable.value.copy(loading = true, error = false, nowMillis = System.currentTimeMillis())
        loadJob = viewModelScope.launch {
            val result = repository.load()
            if (!isActive) return@launch
            mutable.value = if (result.isSuccess) mutable.value.copy(overview = result.getOrThrow(), loading = false)
                else mutable.value.copy(loading = false, error = true)
        }
    }

    fun updateClock() { mutable.value = mutable.value.copy(nowMillis = System.currentTimeMillis()) }
    fun select(tab: HomeTab) { mutable.value = mutable.value.copy(selectedTab = tab) }
    fun showDraftChoice() { mutable.value = mutable.value.copy(showDraftChoice = true) }
    fun dismissDraftChoice() { mutable.value = mutable.value.copy(showDraftChoice = false) }

    class Factory(private val repository: HomeRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = HomeViewModel(repository) as T
    }
}

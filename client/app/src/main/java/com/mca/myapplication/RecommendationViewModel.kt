package com.mca.myapplication

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.mca.myapplication.data.RecommendationAvailability
import com.mca.myapplication.data.RecommendationRepository
import com.mca.myapplication.data.SavedSuggestion
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class RecommendationUiState(
    val mealId: String? = null,
    val candidates: List<SavedSuggestion> = emptyList(),
    val saved: List<SavedSuggestion> = emptyList(),
    val availability: RecommendationAvailability = RecommendationAvailability.NO_MEAL,
    val loading: Boolean = true,
    val saving: Boolean = false,
    val error: Boolean = false,
)

class RecommendationViewModel(private val repository: RecommendationRepository) : ViewModel() {
    private val mutable = MutableStateFlow(RecommendationUiState())
    val state = mutable.asStateFlow()
    private var job: Job? = null

    fun open(mealId: String?) {
        job?.cancel()
        mutable.value = RecommendationUiState()
        job = viewModelScope.launch { refresh(mealId) }
    }

    fun retry() {
        if (mutable.value.saving) return
        job?.cancel()
        job = viewModelScope.launch { refresh(mutable.value.mealId) }
    }

    private suspend fun refresh(mealId: String?) {
        mutable.value = mutable.value.copy(loading = true, error = false)
        val result = repository.load(mealId)
        mutable.value = if (result.isSuccess) result.getOrThrow().let { snapshot ->
            RecommendationUiState(snapshot.meal?.id, snapshot.candidates, snapshot.saved, snapshot.availability, loading = false)
        } else mutable.value.copy(loading = false, saving = false, error = true)
    }

    fun decide(save: Boolean) {
        val state = mutable.value
        val mealId = state.mealId ?: return
        val card = state.candidates.firstOrNull() ?: return
        if (state.saving || state.loading) return
        mutable.value = state.copy(saving = true, error = false)
        job = viewModelScope.launch {
            val result = repository.decide(mealId, card.id, save)
            if (result.isSuccess) refresh(mealId)
            else mutable.value = mutable.value.copy(saving = false, error = true)
        }
    }

    class Factory(private val repository: RecommendationRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = RecommendationViewModel(repository) as T
    }
}

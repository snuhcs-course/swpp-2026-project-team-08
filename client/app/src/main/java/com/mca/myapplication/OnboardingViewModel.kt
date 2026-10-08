package com.mca.myapplication

import android.content.Context
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mca.myapplication.data.OnboardingDraft
import com.mca.myapplication.data.OnboardingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

data class OnboardingUiState(
    val draft: OnboardingDraft = OnboardingDraft(),
    val isSaving: Boolean = false,
    val saveFailed: Boolean = false,
    val completed: Boolean = false,
    val isLoaded: Boolean = false,
    val catalogPage: Int = -1,
    val catalogResults: List<String> = emptyList(),
)

class OnboardingViewModel(
    private val repository: OnboardingRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(OnboardingUiState())
    val state: StateFlow<OnboardingUiState> = mutableState.asStateFlow()
    private var catalogJob: Job? = null
    private var saveJob: Job? = null
    private val saveMutex = Mutex()

    init {
        viewModelScope.launch {
            val result = repository.loadDraft()
            mutableState.value = mutableState.value.copy(
                draft = result.getOrNull() ?: OnboardingDraft(),
                completed = result.getOrNull()?.completed == true,
                saveFailed = result.isFailure,
                isLoaded = true,
            )
        }
    }

    fun save(draft: OnboardingDraft) {
        if (mutableState.value.completed) return
        mutableState.value = mutableState.value.copy(draft = draft, isSaving = true, saveFailed = false)
        saveJob?.cancel()
        saveJob = viewModelScope.launch {
            val result = saveMutex.withLock { repository.saveDraft(draft) }
            mutableState.value = mutableState.value.copy(isSaving = false, saveFailed = result.isFailure)
        }
    }

    fun complete(draft: OnboardingDraft) {
        mutableState.value = mutableState.value.copy(draft = draft, isSaving = true, saveFailed = false)
        saveJob?.cancel()
        viewModelScope.launch {
            saveJob?.cancelAndJoin()
            val result = saveMutex.withLock { repository.complete(draft) }
            mutableState.value = mutableState.value.copy(isSaving = false, saveFailed = result.isFailure, completed = result.isSuccess)
        }
    }

    fun searchCatalog(pageKey: Int, query: String) {
        catalogJob?.cancel()
        if (query.isBlank()) {
            mutableState.value = mutableState.value.copy(catalogPage = pageKey, catalogResults = emptyList())
            return
        }
        catalogJob = viewModelScope.launch {
            repository.searchCatalog(pageKey, query).onSuccess { results ->
                mutableState.value = mutableState.value.copy(catalogPage = pageKey, catalogResults = results)
            }
        }
    }

    class Factory(context: Context) : ViewModelProvider.Factory {
        private val repository = OnboardingRepository(context.applicationContext)

        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            require(modelClass.isAssignableFrom(OnboardingViewModel::class.java))
            return OnboardingViewModel(repository) as T
        }
    }
}
